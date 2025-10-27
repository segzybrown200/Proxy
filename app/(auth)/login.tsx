import {
  View,
  Text,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import React, { useState, useRef } from "react";
import FormField from "../../components/FormFields";
import CustomButton from "../../components/CustomButton";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Fontisto from '@expo/vector-icons/Fontisto';
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Apple from "../../assets/icons/Apple.svg"
import Google from "../../assets/icons/Google.svg"
import { loginState } from "global/authSlice";
import { loginUser } from "api/api";
import { showError } from "utils/toast";

const Login = () => {
  const [isSubmitting, setisSubmitting] = useState(false);

  const dispatch = useDispatch();

  const Schema = yup.object({

    email: yup.string().email().required("Email must be filled"),
    password: yup.string().min(6).required("Password must be filled"),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(Schema) });

  const submit = (data: any) => {
    const FinalData = {
      password: data.password,
      email: data.email,
    };
    setisSubmitting(true);
    Keyboard.dismiss();
    loginUser(FinalData)
      .then((response) => {
        setisSubmitting(false);
        console.log("Login successful:", response.data);
        console.log(response.data)
        dispatch(loginState(response.data));
        // router.replace("/(app)/home");
      })
      .catch((error) => {
        setisSubmitting(false);
        console.log("Login error:", error);
        showError(error.message);
      });
  };

  const scrollRef = useRef<ScrollView>(null);
  return (
    <GestureHandlerRootView>
      <KeyboardAvoidingView
        behavior={'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 5}
        className="w-full flex-1 bg-white h-screen p-5"
      >
            <View className="absolute">
          <Image source={require("../../assets/images/Bubbles1.png")} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}>
    
        <View
          className="mt-56 w-full mb-[30px]
      "
        >
          <TouchableOpacity className="mb-4" onPress={() => router.push("/(auth)/onboarding")}>
            <FontAwesome6 name="arrow-left-long" size={25} color="black" />
          </TouchableOpacity>
          <Text className="font-RalewayBold w-[70%] text-[50px]">
            Login
          </Text>
          <View className="flex flex-row mt-2 items-center gap-2">
            <Text className="font-NunitoLight text-2xl  text-gray-500">
            Good to see you back!
          </Text>
          <Fontisto name="heart" size={20} color="black" />
          </View>
        </View>

        <View className="flex flex-col gap-[5px] ">
          <Controller
            name="email"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                title="Email"
                onBlur={onBlur}
                value={value}
                handleChangeText={onChange}
                name="email"
                errors={errors}
                placeholder="Email"
              />
            )}
          />
        
          <Controller
            name="password"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                title="Password"
                handleChangeText={onChange}
                onBlur={onBlur}
                value={value}
                errors={errors}
                name="password"
                placeholder="Password"
              />
            )}
          />
        </View>
        <View>
          <TouchableOpacity
            className=" mt-5"
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text className="font-NunitoRegular text-primary-100 text-[18px]">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex flex-1 justify-end flex-col  items-center mt-[10px]">
          <CustomButton
            title="Login"
            isLoading={isSubmitting}
            handlePress1={handleSubmit(submit)}
          />
        </View>
        <View>
          <View className="flex-row flex items-center mt-3 justify-center gap-2">
            <View className="border-[0.5px] border-gray-300 w-[45%]"/>
            <Text className="font-NunitoRegular">Or With</Text>
            <View className="border-[0.5px] border-gray-300 w-[45%]"/>
          </View>
          <View className="flex-row justify-center items-center mt-5 gap-10">
            <Apple/>
            <Google/>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};

export default Login;
