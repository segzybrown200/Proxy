import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import FormField from "../../components/FormFields";
import CustomButton from "../../components/CustomButton";
import OtpTextInput from 'react-native-text-input-otp';
import { showError, showSuccess } from "utils/toast";
import { resendOTPEmail, resetPassword, sendOTPEmail } from "api/api";
import { router, useLocalSearchParams } from "expo-router";
const Schema = yup.object({
  otp: yup.string().length(6, "OTP must be 6 digits").required("OTP is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: yup.string().oneOf([yup.ref("password")], "Passwords must match").required("Confirm password is required"),
});

const ResetPassword = () => {
  const params = useLocalSearchParams();
  const email = (params as any)?.email || "";

  const { control, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(Schema) });
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;
    try {
      setIsResending(true);
      await resendOTPEmail({ email});
      setSecondsLeft(60);
    } catch (err: any) {
      showError(err?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    Keyboard.dismiss();
    resetPassword({ email, newPassword: data.password, otp: data.otp }).then(() => {
      setIsSubmitting(false);
      showSuccess("Password reset successfully");
      router.replace("/(auth)/login");
    }).catch((error) => {
      setIsSubmitting(false);
      showError(error?.message || 'Failed to reset password. Please try again.');
    }).finally(() => {
      setIsSubmitting(false);
    });

    
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-white p-5" behavior="padding">
      <View style={{ flex: 1 }}>
        <View className="absolute">
          <Image source={require("../../assets/images/Bubbles.png")} />
        </View>
        <View className="mt-20">
          <Text className="font-RalewayBold text-[36px]">Reset Password</Text>
          <Text className="text-gray-500 text-lg font-NunitoLight mt-2">Set a new password for {email || 'your account'}.</Text>
        </View>

        <View className="mt-8">
          <Text className="font-NunitoLight text-base text-gray-700 mb-2">An OTP has been sent to your email. Enter the 6-digit code below to continue.</Text>
          <Text className="font-NunitoSemiBold text-base mb-2 ml-1">Enter 6-digit OTP</Text>
          <Controller
            name="otp"
            control={control}
            render={({ field: { onChange, value } }) => (
              <OtpTextInput
                otp={value || ''}
                setOtp={onChange}
                digits={6}
                autoFocus={false}
                style={{
                  borderRadius: 0,
                  borderTopWidth: 1,
                  borderRightWidth: 2,
                  borderLeftWidth: 1,
                  height: 60,
                  backgroundColor: "transparent",
                  borderColor: "#004CFF",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                fontStyle={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "black",
                }}
                focusedStyle={{
                  borderColor: "#004CFF",
                  borderBottomWidth: 1,
                  borderTopWidth: 1,
                  borderRightWidth: 1,
                  borderLeftWidth: 1,
                }}
              />
            )}
          />
          {errors.otp && (
            <Text className="text-red-500 font-NunitoRegular text-[13px] mt-[6px]">{errors.otp.message as string}</Text>
          )}
          <View className="flex-row justify-center items-center mt-3 mb-2">
            <Text className="text-gray-500 mr-3">Didn't receive the code?</Text>
            <TouchableOpacity
              disabled={secondsLeft > 0 || isResending}
              onPress={handleResend}
            >
              <Text className={`text-primary-600 font-NunitoSemiBold ${secondsLeft > 0 || isResending ? 'opacity-40' : ''}`}>
                {secondsLeft > 0 ? `Resend (${String(Math.floor(secondsLeft / 60)).padStart(2,'0')}:${String(secondsLeft % 60).padStart(2,'0')})` : (isResending ? 'Resending...' : 'Resend Code')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View className="mt-10">
          <Controller
            name="password"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                title="Password"
                onBlur={onBlur}
                value={value}
                handleChangeText={onChange}
                name="password"
                errors={errors}
                placeholder="New password"
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                title="Confirm Password"
                onBlur={onBlur}
                value={value}
                handleChangeText={onChange}
                name="confirmPassword"
                errors={errors}
                placeholder="Repeat password"
              />
            )}
          />
        </View>
        <View className="flex-1 justify-end items-center mb-10">
          <CustomButton title="Reset Password" isLoading={isSubmitting} handlePress1={handleSubmit(onSubmit)} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;
           