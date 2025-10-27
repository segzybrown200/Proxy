import {
  View,
  Text,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import FormField from '../../components/FormFields';
import CustomButton from '../../components/CustomButton';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { router } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { forgotPassword } from 'api/api';
import { showError } from 'utils/toast';

const Schema = yup.object({
  email: yup.string().email().required('Email is required'),
});


const ForgotPassword = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(Schema) });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = (data: any) => {
    // Here you'd call your backend to send the reset code to data.email
    // For now navigate to verify-reset-OTP with email as query param
    setIsSubmitting(true);

    forgotPassword({ email: data.email }).then(() => {
      setIsSubmitting(false);
      router.replace(`/(auth)/reset-password?email=${encodeURIComponent(data.email)}`);
    }).catch((error) => {
      setIsSubmitting(false);
      showError(error?.error?.message)
    });
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-white p-5" behavior="padding">
      <View className="absolute">
        <Image source={require('../../assets/images/Bubbles2.png')} />
      </View>
      <View className="mt-12">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
           <FontAwesome6 name="arrow-left-long" size={25} color="black" />
        </TouchableOpacity>
        <Text className="font-RalewayBold text-[36px]">Forgot Password</Text>
        <Text className="text-gray-500 text-lg font-NunitoLight mt-2">Enter the email address associated with your account and we'll send a verification code.</Text>
      </View>

      <View className="mt-6">
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
              placeholder="Email address"
            />
          )}
        />
      </View>

      <View className="flex-1 justify-end items-center mb-10">
        <CustomButton title="Send code" isLoading={isSubmitting} handlePress1={handleSubmit(onSubmit)} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;