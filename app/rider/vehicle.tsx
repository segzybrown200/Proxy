import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import ProgressSteps from "../../components/ProgressSteps";
import { Ionicons } from "@expo/vector-icons";
import { riderVechicleUpload } from "../../api/api";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { setVehicleDetails } from "../../global/riderSlice";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from 'expo-image-manipulator';
import * as Yup from "yup";
import { RootState } from "global/store";

const registrationSteps = [
  { title: "Personal", icon: "account" },
  { title: "Documents", icon: "file-document" },
  { title: "Vehicle", icon: "car" },
  { title: "Review", icon: "check-circle" },
];

const validationSchema = Yup.object().shape({
  brand: Yup.string().required("Vehicle brand is required"),
  model: Yup.string().required("Vehicle model is required"),
  plateNumber: Yup.string().required("Plate number is required"),
  frontView: Yup.string().required("Front view photo is required"),
  backView: Yup.string().required("Back view photo is required"),
  document: Yup.string().required("Vehicle document is required"),
});

const VehicleDetails = () => {
  const dispatch = useDispatch();
  const user: any = useSelector((state: RootState) => state.auth.user);
  const token = user?.data?.token || "";
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    plateNumber: "",
    frontView: "",
    backView: "",
    document: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
      if (!fileInfo.exists) return uri;
      const size = (fileInfo as any).size || 0;

      // If file size is less than ~800KB, skip compress
      if (size < 800 * 1024) return uri;

      // Determine quality based on size
      let quality = 0.85;
      if (size > 5 * 1024 * 1024) quality = 0.45;
      else if (size > 2 * 1024 * 1024) quality = 0.65;

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri || uri;
    } catch (e) {
      console.warn('compressImage error', e);
      return uri;
    }
  };

  const handleImagePick = async (type: "frontView" | "backView" | "document") => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!cameraPermission.granted || !libraryPermission.granted) {
        Alert.alert("Permission needed", "Please allow access to camera and photos.");
        return;
      }

      // Let user choose between camera and gallery
      const source = await new Promise<string>((resolve) => {
        Alert.alert(
          "Select Image Source",
          "Choose where you want to pick the image from",
          [
            {
              text: "Camera",
              onPress: () => resolve("camera"),
            },
            {
              text: "Gallery",
              onPress: () => resolve("gallery"),
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve("cancel"),
            },
          ]
        );
      });

      if (source === "cancel") return;

      const result = await (source === "camera"
        ? ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          }));

      if (!result.canceled && result.assets?.[0]?.uri) {
        const compressedUri = await compressImage(result.assets[0].uri);
        setFormData((prev) => ({
          ...prev,
          [type]: compressedUri,
        }));
        setErrors((prev) => ({ ...prev, [type]: "" }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleSubmit = async () => {
    try {
      await validationSchema.validate(formData, { abortEarly: false });
      setUploading(true);
      setUploading(true);
      setUploadProgress(0);

      const form = new FormData();
      form.append("brand", formData.brand);
      form.append("model", formData.model);
      form.append("plateNumber", formData.plateNumber);

      // helper to append compressed file
      const fileAppend = async (fieldName: string, uri: string) => {
        const compressedUri = await compressImage(uri);
        const name = compressedUri.split('/').pop() || `${fieldName}.jpg`;
        const match = name.match(/\.(\w+)$/);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        // @ts-ignore
        form.append(fieldName, { uri: compressedUri, name, type: mimeType });
      };

      // Append each image file after compression
      await Promise.all([
        fileAppend('frontView', formData.frontView),
        fileAppend('backView', formData.backView),
        fileAppend('document', formData.document)
      ]);

      await riderVechicleUpload(form, token, (progress) => {
        setUploadProgress(progress);
      });

      dispatch(setVehicleDetails({
        make: formData.brand,
        model: formData.model,
        year: new Date().getFullYear().toString(),
        plateNumber: formData.plateNumber,
        registrationDoc: formData.document,
        insurance: formData.document,
        photos: [formData.frontView, formData.backView],
      }));
      
      router.push("rider/confirmation");
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const validationErrors: { [key: string]: string } = {};
        err.inner.forEach((error) => {
          if (error.path) {
            validationErrors[error.path] = error.message;
          }
        });
        setErrors(validationErrors);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Progress Steps */}
 
      
      {/* Header */}
      <View className="px-4 pt-14 pb-4 flex-row items-center border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-[#ECF0F4] rounded-full p-2 mr-3"
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="font-RalewayBold text-xl text-black">
          Vehicle Details
        </Text>
      </View>

           <ProgressSteps currentStep={2} steps={registrationSteps} />

      {/* Form */}
      <ScrollView className="flex-1 px-4 py-6">
        {/* Basic Vehicle Info */}
        <View className="space-y-4 mb-6">
          <View>
            <Text className="font-RalewayBold text-base text-black mb-2">
              Vehicle Brand
            </Text>
            <TextInput
              value={formData.brand}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, brand: text }));
                setErrors(prev => ({ ...prev, brand: "" }));
              }}
              placeholder="e.g., Toyota, Honda, etc."
              className="bg-gray-50 p-4 rounded-xl font-NunitoRegular text-black"
            />
            {errors.brand && (
              <Text className="text-red-500 mt-1 font-NunitoRegular">
                {errors.brand}
              </Text>
            )}
          </View>

          <View>
            <Text className="font-RalewayBold text-base text-black mb-2">
              Vehicle Model
            </Text>
            <TextInput
              value={formData.model}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, model: text }));
                setErrors(prev => ({ ...prev, model: "" }));
              }}
              placeholder="e.g., Camry, Civic, etc."
              className="bg-gray-50 p-4 rounded-xl font-NunitoRegular text-black"
            />
            {errors.model && (
              <Text className="text-red-500 mt-1 font-NunitoRegular">
                {errors.model}
              </Text>
            )}
          </View>

          <View>
            <Text className="font-RalewayBold text-base text-black mb-2">
              Plate Number
            </Text>
            <TextInput
              value={formData.plateNumber}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, plateNumber: text }));
                setErrors(prev => ({ ...prev, plateNumber: "" }));
              }}
              placeholder="Enter vehicle plate number"
              className="bg-gray-50 p-4 rounded-xl font-NunitoRegular text-black"
            />
            {errors.plateNumber && (
              <Text className="text-red-500 mt-1 font-NunitoRegular">
                {errors.plateNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Document Uploads */}
        <View className="space-y-6">
          {/* Vehicle Front View */}
          <View>
            <Text className="font-RalewayBold text-base text-black mb-2">
              Vehicle Front View
            </Text>
            {formData.frontView ? (
              <View className="relative">
                <Image
                  source={{ uri: formData.frontView }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => handleImagePick("frontView")}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                >
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleImagePick("frontView")}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
              >
                <Ionicons name="cloud-upload-outline" size={32} color="#999" />
                <Text className="font-NunitoMedium text-gray-600 mt-2">
                  Upload front view
                </Text>
              </TouchableOpacity>
            )}
            {errors.frontView && (
              <Text className="text-red-500 mt-1 font-NunitoRegular">
                {errors.frontView}
              </Text>
            )}
          </View>

          {/* Vehicle Back View */}
          <View>
            <Text className="font-RalewayBold text-base text-black mb-2">
              Vehicle Back View
            </Text>
            {formData.backView ? (
              <View className="relative">
                <Image
                  source={{ uri: formData.backView }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => handleImagePick("backView")}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                >
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleImagePick("backView")}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
              >
                <Ionicons name="cloud-upload-outline" size={32} color="#999" />
                <Text className="font-NunitoMedium text-gray-600 mt-2">
                  Upload back view
                </Text>
              </TouchableOpacity>
            )}
            {errors.backView && (
              <Text className="text-red-500 mt-1 font-NunitoRegular">
                {errors.backView}
              </Text>
            )}
          </View>

          {/* Vehicle Document */}
          <View>
            <Text className="font-RalewayBold text-base text-black mb-2">
              Vehicle Document
            </Text>
            {formData.document ? (
              <View className="relative">
                <Image
                  source={{ uri: formData.document }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => handleImagePick("document")}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                >
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleImagePick("document")}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
              >
                <Ionicons name="cloud-upload-outline" size={32} color="#999" />
                <Text className="font-NunitoMedium text-gray-600 mt-2">
                  Upload vehicle document
                </Text>
              </TouchableOpacity>
            )}
            {errors.document && (
              <Text className="text-red-500 mt-1 font-NunitoRegular">
                {errors.document}
              </Text>
            )}
          </View>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <View className="bg-gray-100 rounded-xl p-4">
              <Text className="font-RalewayBold text-center">
                Uploading: {uploadProgress}%
              </Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={uploading}
          className={`py-4 rounded-xl mb-32 mt-8 ${
            uploading ? "bg-gray-400" : "bg-primary-100"
          }`}
        >
          {uploading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="white" />
              <Text className="text-white ml-2 font-RalewayBold text-lg">
                Uploading...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-center font-RalewayBold text-lg">
              Submit for Review
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VehicleDetails;