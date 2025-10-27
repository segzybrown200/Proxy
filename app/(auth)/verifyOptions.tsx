import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import React, { useState } from "react";
import CustomButton from "../../components/CustomButton";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Fontisto from '@expo/vector-icons/Fontisto';
import { router, useLocalSearchParams } from "expo-router";
import { sendOTPEmail } from "api/api";
import { showError } from "utils/toast";

const verifyOptions = () => {
  const [isSubmitting, setisSubmitting] = useState(false);
  const [method, setMethod] = useState<'whatsapp'|'email'>('whatsapp');
  const {email,phone} = useLocalSearchParams();

  const handleNext = () => {
    // navigate and include selected method as query param
    setisSubmitting(true);
    if(method === 'whatsapp'){
      sendOTPEmail({email: email as string, phone: phone as string, verifyOption: 'whatsapp'}).then((response) => {
        console.log("OTP sent via WhatsApp:", response);
        setisSubmitting(false);
        router.push({pathname: `/(auth)/verify-email` , params: {email: email, phone: phone, verifyOption: 'whatsapp'}});
      }).catch((error) => {
        setisSubmitting(false);
        showError("Failed to send OTP via WhatsApp. Please try again.");
      });
      
    }else if(method === 'email'){
      sendOTPEmail({email: email as string, phone: phone as string, verifyOption: 'email'}).then((response) => {
        console.log("OTP sent via Email:", response.data);
        setisSubmitting(false);
        router.push(`/(auth)/verify-email`);
        router.push({pathname: `/(auth)/verify-email` , params: {email: email, phone: phone, verifyOption: 'email'}});
      }).catch((error) => {
        console.log(error)
        setisSubmitting(false);
        showError("Failed to send OTP via Email. Please try again.");
      });
  }
};

  return (
    <>
      <SafeAreaView
        className=" flex-1 bg-white "
      >
            <View className="absolute">
          <Image source={require("../../assets/images/Bubbles2.png")}  />
        </View>
        <View>
    
        <View
          className="mt-20 p-5 w-full mb-[30px]
      "
        >
          <TouchableOpacity className="mb-4" onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left-long" size={25} color="black" />
          </TouchableOpacity>
          <Text className="font-RalewayBold mt-[60px] self-center text-[40px]">
            OTP Verification 
          </Text>
          <View className="flex flex-row mt-2 items-center gap-2 self-center ">
            <Text className="font-NunitoLight w-[60%] text-2xl  text-gray-500 self-center text-center ">
            How you would like to receive your OTP?
          </Text>
          </View>
        </View>
        {/* Select either whatsapp or Email */}
        <View className="px-5">
          <View className="flex-col justify-between items-center ">
            <TouchableOpacity
              onPress={() => setMethod('whatsapp')}
              className={`w-full mb-5 p-4 rounded-2xl ${method === 'whatsapp' ? 'bg-primary-100' : 'bg-[#F8F8F8]'}`}
            >
              <View className="flex-row items-center">
                <Fontisto name="whatsapp" size={28} color={method === 'whatsapp' ? 'white' : 'black'} />
                <View style={{ marginLeft: 12 }}>
                  <Text className={`text-2xl font-RalewayBold ${method === 'whatsapp' ? 'text-white' : 'text-black'}`}>
                    WhatsApp
                  </Text>
                  <Text className={`text-lg font-NunitoRegular ${method === 'whatsapp' ? 'text-white' : 'text-gray-500'}`}>
                    Receive OTP via WhatsApp
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMethod('email')}
              className={`w-full p-4 rounded-2xl ${method === 'email' ? 'bg-primary-100' : 'bg-[#F8F8F8]'}`}
            >
              <View className="flex-row items-center">
                <FontAwesome6 name="envelope" size={24} color={method === 'email' ? 'white' : 'black'} />
                <View style={{ marginLeft: 12 }}>
                  <Text className={`text-2xl font-NunitoSemiBold ${method === 'email' ? 'text-white' : 'text-black'}`}>
                    Email
                  </Text>
                  <Text className={`text-lg font-NunitoRegular ${method === 'email' ? 'text-white' : 'text-gray-500'}`}>
                    Receive OTP via Email
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>


        <View className="flex flex-1 justify-end flex-col  items-center mt-[120px] p-5">
          <CustomButton
            title="Next"
            isLoading={isSubmitting}
            handlePress1={handleNext}
          />
        </View>

        </View>
      </SafeAreaView>
      </>
  );
};

export default verifyOptions;
