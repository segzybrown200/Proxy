import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import ProgressSteps from "../../components/ProgressSteps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { setPersonalInfo } from "../../global/riderSlice";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Yup from "yup";
import CustomButton from "../../components/CustomButton";
import { registerRider } from "../../api/api";
import { RootState } from "../../global/store";
import { showError } from "../../utils/toast";

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(3, "Name must be at least 3 characters")
    .matches(/^[a-zA-Z\s]*$/, "Name can only contain letters and spaces")
    .required("Full name is required"),
  dateOfBirth: Yup.string()
    .required("Date of birth is required")
    .test("age", "You must be at least 18 years old", (value) => {
      if (!value) return false;
      const dob = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      return age >= 18;
    }),
  phone: Yup.string()
    .matches(/^[0-9]+$/, "Must be only digits")
    .min(10, "Must be exactly 10 digits")
    .max(15, "Must be between 10 and 15 digits")
    .required("Phone number is required"),
  vehicleType: Yup.string().required("Vehicle type is required"),
});

const registrationSteps: any = [
  { title: "Personal", icon: "account" },
  { title: "Documents", icon: "file-document" },
  { title: "Vehicle", icon: "car" },
  { title: "Review", icon: "check-circle" },
];

const PersonalInfo = () => {
  const dispatch = useDispatch();
    const user: any = useSelector((state: RootState) => state.auth.user);
  const token = user?.data?.token || "";


  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    phone: "",
    vehicleType: "",
  });
  const [vehiclePickerVisible, setVehiclePickerVisible] = useState(false);
  const vehicleOptions = ["Motorcycle", "Bicycle", "Car"];
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await validationSchema.validate(formData, { abortEarly: false });
      dispatch(setPersonalInfo(formData));
      // clear persisted draft when moving forward
      try {
        await AsyncStorage.removeItem('riderPersonalForm');
      } catch (e) {
        console.warn('Failed to remove saved rider form', e);
      }

      console.log(formData)

      registerRider(formData, token).then((res) => {
        console.log(res.data)
        setLoading(false);
        router.push("rider/kyc");
      }).catch((err)=>{
        console.log(err)
        showError(err.message || "Failed to register rider. Please try again." );
        setLoading(false);
      })
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const validationErrors: { [key: string]: string } = {};
        err.inner.forEach((error) => {
          if (error.path) {
            validationErrors[error.path] = error.message;
          }
        });
        setLoading(false);
        setErrors(validationErrors);
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        dateOfBirth: selectedDate.toISOString().split("T")[0],
      });
    }
  };

  // Load persisted form on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('riderPersonalForm');
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.warn('Failed to load saved rider form', e);
      }
    })();
  }, []);

  // Persist form on change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('riderPersonalForm', JSON.stringify(formData));
      } catch (e) {
        console.warn('Failed to save rider form', e);
      }
    })();
  }, [formData]);

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
          Personal Information
        </Text>
      </View>

         <ProgressSteps currentStep={0} steps={registrationSteps} />

      {/* Form */}
      <ScrollView className="flex-1 px-4 py-6">
        <View className="space-y-4">
          {/* Full Name */}
          <View>
            <Text className="font-RalewayBold text-base text-black mb-2">
              Full Name
            </Text>
            <TextInput
              value={formData.fullName}
              onChangeText={(text) => {
                setFormData({ ...formData, fullName: text });
                setErrors({ ...errors, fullName: "" });
              }}
              placeholder="As shown on your ID"
              className="bg-gray-50 p-4 rounded-xl font-NunitoRegular text-black"
            />
            {errors.fullName && (
              <Text className="text-red-500 mt-1 font-NunitoRegular">
                {errors.fullName}
              </Text>
            )}
          </View>

          {/* Date of Birth */}
          <View>
            <Text className="font-RalewayBold text-base text-black mb-2">
              Date of Birth
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-gray-50 p-4 rounded-xl"
            >
              <Text className="font-NunitoRegular text-black">
                {formData.dateOfBirth || "Select date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={
                  formData.dateOfBirth
                    ? new Date(formData.dateOfBirth)
                    : new Date()
                }
                mode="date"
                onChange={handleDateChange}
              />
            )}
            {errors.dateOfBirth && (
              <Text className="text-red-500 mt-1 font-NunitoRegular">
                {errors.dateOfBirth}
              </Text>
            )}
          </View>

          {/* Vehicle Type */}
          <View>
            <Text className="font-RalewayBold text-base text-black mb-2">
              Vehicle Type
            </Text>
            <TouchableOpacity
              onPress={() => setVehiclePickerVisible(true)}
              className="bg-gray-50 p-4 rounded-xl"
            >
              <Text className={`font-NunitoRegular text-black ${formData.vehicleType ? '' : 'text-gray-400'}`}>
                {formData.vehicleType || 'Select vehicle type'}
              </Text>
            </TouchableOpacity>
            {errors.vehicleType && (
              <Text className="text-red-500 mt-1 font-NunitoRegular">
                {errors.vehicleType}
              </Text>
            )}
          </View>

          {/* Phone Number */}
          <View>
            <Text className="font-RalewayBold text-base text-black mb-2">
              Phone Number
            </Text>
            <TextInput
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({ ...formData, phone: text });
                setErrors({ ...errors, phone: "" });
              }}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              className="bg-gray-50 p-4 rounded-xl font-NunitoRegular text-black"
            />
            {errors.phone && (
              <Text className="text-red-500 mt-1 font-NunitoRegular">
                {errors.phone}
              </Text>
            )}
          </View>
        </View>

        {/* Submit Button */}

        <CustomButton containerStyles="mt-8" title="Continue to Verification" isLoading={loading} handlePress1={handleSubmit} />
      </ScrollView>
      {/* Vehicle Picker Modal */}
      <Modal
        visible={vehiclePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setVehiclePickerVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setVehiclePickerVisible(false)}
          className="flex-1 justify-end bg-black/30"
        >
          <View className="bg-white rounded-t-2xl p-4">
            <Text className="font-RalewaySemiBold text-lg mb-3">Select vehicle type</Text>
            {vehicleOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                className="py-3 border-b border-gray-100"
                onPress={() => {
                  setFormData({ ...formData, vehicleType: opt });
                  setErrors({ ...errors, vehicleType: "" });
                  setVehiclePickerVisible(false);
                }}
              >
                <Text className="font-NunitoRegular text-base">{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="mt-4 py-3"
              onPress={() => setVehiclePickerVisible(false)}
            >
              <Text className="text-center font-NunitoMedium text-primary-100">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default PersonalInfo;