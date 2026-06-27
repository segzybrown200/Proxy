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
import { riderKYCUpload, verifyNinNumber } from "../../api/api";
import { showError, showSuccess } from "../../utils/toast";

const registrationSteps: any = [
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
  const user = useSelector(selectUser) as any;
  const token = (user && (user as any)?.data?.token) || null;
  const personalInfo = useSelector((s:any) => s.rider?.personalInfo);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [verifyingNin, setVerifyingNin] = useState(false);
  const [verifiedNin, setVerifiedNin] = useState(false);
  const [verifiedInfo, setVerifiedInfo] = useState<{ fullName?: string; dob?: string } | null>(null);

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

  // Normalize full name for comparison
  const normalizeName = (name: string): string => {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  // Format date to YYYY-MM-DD for comparison
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const s = dateString.toString().trim();

    // Handle YYYY-MM-DD or YYYY/MM/DD
    const ymd = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
    if (ymd) {
      const [, y, m, d] = ymd;
      const mm = m.padStart(2, '0');
      const dd = d.padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    }

    // Handle DD-MM-YYYY or DD/MM/YYYY
    const dmy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      const mm = m.padStart(2, '0');
      const dd = d.padStart(2, '0');
      return `${y}-${mm}-${dd}`;
    }

    // Fallback to Date parsing
    const date = new Date(s);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return '';
  };

  const formatReadableDate = (dateString: string) => {
    const norm = formatDate(dateString);
    if (!norm) return '';
    const [y, m, d] = norm.split('-');
    return `${d}/${m}/${y}`;
  };

  const toTitleCase = (s = '') =>
    s
      .toLowerCase()
      .split(' ')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
      .join(' ');

  // Verify NIN and validate against personal info
  const handleVerifyNin = async () => {
    if (!ninNumber.trim()) {
      showError("Please enter your NIN number");
      return;
    }

    // Validate NIN format (11 digits)
    if (!/^\d{11}$/.test(ninNumber)) {
      showError("NIN must be exactly 11 digits");
      return;
    }

    setVerifyingNin(true);
    try {
      // Check if we have cached verification data for this NIN
      const cachedData = await AsyncStorage.getItem('ninVerificationData');
      let verificationData = null;
      let isFromCache = false;

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.nin === ninNumber) {
          verificationData = parsed.verificationData;
          isFromCache = true;
        }
      }

      if (!isFromCache) {
        // No cache, call API
        const response = await verifyNinNumber(ninNumber);
        
        if (response?.data?.status === 'error') {
          showError(response.data.message || "NIN verification failed");
          return;
        }

        // Get verification data
        verificationData = response.data?.data?.verificationData?.data;
        if (!verificationData) {
          showError("Invalid response from verification service");
          return;
        }
      }

      // Extract and normalize names from verification data
      const verifiedFirstName = (verificationData.firstname || '').toLowerCase().trim();
      const verifiedSurname = (verificationData.surname || verificationData.lastname || '').toLowerCase().trim();
      const verifiedFullName = `${verifiedFirstName} ${verifiedSurname}`.trim();

      // Normalize personal info names
      const personalFullName = normalizeName(personalInfo?.fullName || '');

      const getNameTokens = (name: string) =>
        name
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((token) => token.replace(/[^a-z]/g, ''))
          .filter(Boolean);

      const nameTokensMatch = (firstName: string, secondName: string) => {
        const firstTokens = getNameTokens(firstName);
        const secondTokens = getNameTokens(secondName);
        const common = firstTokens.filter((token) => secondTokens.includes(token));
        return common.length >= 2;
      };

      // Extract DOB from verification data (could be 'birthdate' or 'dob')
      const verifiedDob = verificationData.birthdate || verificationData.dob;
      const personalDob = formatDate(personalInfo?.dateOfBirth || '');

      // Check if names match by at least two common tokens, regardless of order
      const namesMatch =
        nameTokensMatch(personalFullName, verifiedFullName) ||
        personalFullName === verifiedFullName;

      // Check if DOB matches
      const dobMatches = verifiedDob && formatDate(verifiedDob) === personalDob;

      // Save verification data locally regardless of match/mismatch to avoid repeated API calls
      await AsyncStorage.setItem('ninVerificationData', JSON.stringify({
        nin: ninNumber,
        verificationData: verificationData,
        verifiedAt: new Date().toISOString(),
        namesMatch: namesMatch,
        dobMatches: dobMatches
      }));

      if (!namesMatch || !dobMatches) {
        Alert.alert(
          "Information Mismatch",
          `The information from your NIN does not match what you provided:\n\n` +
          `${!namesMatch ? `• Full Name: Expected "${personalInfo?.fullName}" but NIN shows "${verifiedFullName}"\n` : ''}` +
          `${!dobMatches ? `• Date of Birth: Expected "${personalDob}" but NIN shows "${verifiedDob}"\n` : ''}` +
          `\nPlease go back and correct your personal information.`,
          [
            {
              text: "Go Back to Personal Info",
              onPress: () => router.push("rider/personal-info"),
              style: "default"
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
        return;
      }

      // If all matches, save verified state for UI
      setVerifiedNin(true);
      setVerifiedInfo({ fullName: toTitleCase(verifiedFullName), dob: formatDate(verifiedDob) });

      showSuccess(isFromCache ? "NIN verified from cache!" : "NIN verified successfully!");
      // Can now allow document upload
    } catch (error: any) {
      console.error('NIN verification error:', error);
      showError(error?.message || "Failed to verify NIN. Please try again.");
    } finally {
      setVerifyingNin(false);
    }
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
    // Validate NIN is verified first
    if (!ninNumber || !/^\d{11}$/.test(ninNumber)) {
      Alert.alert("Missing Information", "Please verify your NIN first by clicking the 'Verify NIN' button.");
      return;
    }

    // Check if NIN was verified (has verification data in storage and matches)
    try {
      const verificationData = await AsyncStorage.getItem('ninVerificationData');
      if (!verificationData) {
        Alert.alert("Missing Information", "Please verify your NIN first by clicking the 'Verify NIN' button.");
        return;
      }
      const parsed = JSON.parse(verificationData);
      if (parsed.nin !== ninNumber || !parsed.namesMatch || !parsed.dobMatches) {
        Alert.alert("Missing Information", "Please verify your NIN first by clicking the 'Verify NIN' button.");
        return;
      }
    } catch (e) {
      Alert.alert("Error", "Failed to check NIN verification status");
      return;
    }
    
    // Validate required documents
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
              {/* NIN Input and Verification */}
              <View className="mb-6">
                <Text className="font-RalewayBold text-base text-black mb-2">NIN Number</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    value={ninNumber}
                    onChangeText={setNinNumber}
                    placeholder="Enter 11-digit NIN"
                    keyboardType="numeric"
                    maxLength={11}
                    editable={!verifyingNin}
                    className="flex-1 bg-gray-50 p-4 rounded-xl font-NunitoRegular text-black"
                  />
                  <TouchableOpacity
                    onPress={handleVerifyNin}
                    disabled={verifyingNin || !ninNumber || verifiedNin}
                    className={`px-4 py-4 rounded-xl justify-center ${
                      verifyingNin || !ninNumber
                        ? "bg-gray-300"
                        : verifiedNin
                        ? "bg-green-500"
                        : "bg-primary-100"
                    }`}
                  >
                    {verifyingNin ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Ionicons name="checkmark-circle" size={24} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
                <Text className="text-gray-600 text-xs mt-2 font-NunitoRegular">
                  Your NIN will be verified against your personal information
                </Text>

                {verifiedNin && verifiedInfo && (
                  <View className="mt-3 bg-green-50 p-3 rounded-lg">
                    <Text className="font-NunitoMedium text-sm text-green-800">
                      Verified Name: {verifiedInfo.fullName}
                    </Text>
                    <Text className="font-NunitoRegular text-sm text-green-800 mt-1">
                      Date of Birth: {formatReadableDate(verifiedInfo.dob || '')}
                    </Text>
                  </View>
                )}
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
          disabled={uploading || !verifiedNin}
          className={`py-4 rounded-xl mt-4 mb-32 ${
            uploading || !verifiedNin ? "bg-gray-400" : "bg-primary-100"
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