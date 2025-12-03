import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import ProgressSteps from "../../components/ProgressSteps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../global/authSlice";
import { setKycDocuments } from "../../global/riderSlice";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { riderKYCUpload } from "../../api/api";

const registrationSteps = [
  { title: "Personal", icon: "account" },
  { title: "Documents", icon: "file-document" },
  { title: "Vehicle", icon: "car" },
  { title: "Review", icon: "check-circle" },
];

interface DocumentUpload {
  licensePhoto: string;
  profilePhoto: string;
  identityDocument: string;
  addressProof?: string;
}

const KYCVerification = () => {
  const dispatch = useDispatch();
  const [documents, setDocuments] = useState<DocumentUpload>({
    licensePhoto: "",
    profilePhoto: "",
    identityDocument: "",
  });
  const [ninNumber, setNinNumber] = useState("");
  const [idType, setIdType] = useState("");
  const user = useSelector(selectUser) as any;
  const token = (user && (user as any)?.data?.token) || null;
  const personalInfo = useSelector((s:any) => s.rider?.personalInfo);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

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

  const validateImage = (uri: string, documentType: keyof DocumentUpload) => {
    // Add specific validation rules for each document type
    switch (documentType) {
      case 'licensePhoto':
        // License should be landscape
        // Add specific validation here
        break;
      case 'profilePhoto':
        // Profile should be portrait/square
        // Add specific validation here
        break;
      default:
        break;
    }
    return true;
  };

  const handleImagePick = async (documentType: keyof DocumentUpload) => {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!cameraPermission.granted || !libraryPermission.granted) {
        Alert.alert("Permission needed", "Please allow access to camera and photos.");
        return;
      }

      // Let user choose between camera and gallery
      const source = await new Promise((resolve) => {
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
            aspect: documentType === "profilePhoto" ? [1, 1] : [4, 3],
            quality: 1,
          })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: documentType === "profilePhoto" ? [1, 1] : [4, 3],
            quality: 1,
          }));

      if (!result.canceled && result.assets?.[0]?.uri) {
        setDocuments((prev) => ({
          ...prev,
          [documentType]: result.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };


  const handleSubmit = async () => {
    // Validate required fields
    if (!ninNumber || !idType) {
      Alert.alert("Missing Information", "Please provide NIN number and ID type.");
      return;
    }
    
    // Validate required documents (excluding addressProof which is optional)
    const requiredDocs = ['licensePhoto', 'profilePhoto', 'identityDocument'];
    const missingDocs = requiredDocs.filter(doc => !documents[doc as keyof DocumentUpload]);
    
    if (missingDocs.length > 0) {
      Alert.alert("Missing Documents", "Please upload all required documents (Profile Photo, Driver's License, and Identity Document).");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("ninNumber", ninNumber);
      form.append("idType", idType);

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

      // Always append selfie, idCard, license if present
      if (documents.profilePhoto) await fileAppend('selfie', documents.profilePhoto);
      if (documents.identityDocument) await fileAppend('idCard', documents.identityDocument);
      if (documents.licensePhoto) await fileAppend('license', documents.licensePhoto);

  // roadWorthiness (addressProof) required only for Car or Motorcycle
  const vehicleType = personalInfo?.vehicleType || '';

      const needsRoadWorthiness = ['Car', 'Motorcycle'].includes(vehicleType.toLowerCase());

      if (documents.addressProof) {
        // if provided, append
        if (needsRoadWorthiness) {
          await fileAppend('roadWorthiness', documents.addressProof);
        } else {
          // If not required but provided, still append under same field
          await fileAppend('roadWorthiness', documents.addressProof);
        }
      } else if (needsRoadWorthiness && !documents.addressProof) {
        // guard - should have been validated earlier
        throw new Error('Road worthiness document required for selected vehicle type');
      }

      // call api helper with progress callback
      let serverResponse: any = null;
      const res = await riderKYCUpload(form, token, (percent) => {
        // update upload progress UI
        setUploadProgress(percent);
      });
      serverResponse = res;

      // Normalize returned kyc object
      const respData = serverResponse?.data ?? serverResponse;
      const kyc = respData?.data ?? respData;

      // Map backend URLs into our local keys
      console.log(kyc)
      const serverDocs = {
        profilePhoto: kyc?.selfieUrl || kyc?.selfie || '',
        licensePhoto: kyc?.licenseUrl || '',
        identityDocument: kyc?.idCardUrl || kyc?.idCard || '',
        addressProof: kyc?.roadWorthinessUrl || kyc?.roadWorthiness || '',
      };

      // persist server URLs and dispatch to redux
      try {
        await AsyncStorage.setItem('riderKycDocs', JSON.stringify(serverDocs));
      } catch (e) {
        console.warn('Failed to persist KYC docs', e);
      }
      dispatch(setKycDocuments(serverDocs));
      router.push('rider/vehicle');
    } catch (error: any) {
      console.error('riderKYCUpload error:', error);
      Alert.alert('Error', error?.message || 'Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const DocumentUploadButton = ({
    title,
    description,
    type,
    value,
  }: {
    title: string;
    description: string;
    type: keyof DocumentUpload;
    value: string | undefined;
  }) => (
    <View className="mb-6">
      <Text className="font-RalewayBold text-base text-black mb-2">{title}</Text>
      <Text className="font-NunitoRegular text-gray-600 mb-3">
        {description}
      </Text>
      {value ? (
        <View className="relative">
          <Image
            source={{ uri: value }}
            className="w-full h-48 rounded-xl"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => handleImagePick(type)}
            className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
          >
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => handleImagePick(type)}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
        >
          <Ionicons name="cloud-upload-outline" size={32} color="#999" />
          <Text className="font-NunitoMedium text-gray-600 mt-2">
            Tap to upload
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
          Identity Verification
        </Text>
      </View>
            <ProgressSteps currentStep={1} steps={registrationSteps} />

      {/* Document Upload Section */}
      <ScrollView className="flex-1 px-4 py-6">
              {/* NIN and ID Type */}
              <View className="mb-6">
                <Text className="font-RalewayBold text-base text-black mb-2">NIN / ID Number</Text>
                <TextInput
                  value={ninNumber}
                  onChangeText={setNinNumber}
                  placeholder="Enter NIN or ID number"
                  className="bg-gray-50 p-4 rounded-xl font-NunitoRegular text-black"
                />
              </View>

              <View className="mb-6">
                <Text className="font-RalewayBold text-base text-black mb-2">ID Type</Text>
                <View className="flex-row gap-2">
                  {['NIN', 'Passport', 'Driver License'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setIdType(t)}
                      className={`px-4 py-2 rounded-full ${idType === t ? 'bg-primary-100' : 'bg-gray-100'}`}>
                      <Text className={`${idType === t ? 'text-white' : 'text-gray-800'} font-NunitoMedium`}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
        <DocumentUploadButton
          title="Profile Photo"
          description="A clear photo of your face against a plain background"
          type="profilePhoto"
          value={documents.profilePhoto}
        />

        <DocumentUploadButton
          title="Driver's License"
          description="Front view of your valid driver's license"
          type="licensePhoto"
          value={documents.licensePhoto}
        />

        <DocumentUploadButton
          title="Identity Document"
          description="National ID card or passport"
          type="identityDocument"
          value={documents.identityDocument}
        />


        {
          (personalInfo?.vehicleType === "Motorcycle" || personalInfo?.vehicleType === "Car") && (
            <DocumentUploadButton
              title="Road Worthiness Document (Optional)"
              description="Road worthiness certificate for your vehicle"
              type="addressProof"
              value={documents.addressProof}
            />
          )
        }



        {/* Upload progress */}
        {uploading && (
          <View className="mb-4">
            <Text className="text-gray-600">Uploading: {uploadProgress}%</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={uploading}
          className={`py-4 rounded-xl mt-4 mb-32 ${
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
              Continue to Vehicle Details
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default KYCVerification;