import {
  View,
  Text,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  StatusBar,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import FormField from "../../components/FormFields";
import CustomButton from "../../components/CustomButton";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import countryData from "../../assets/data/countries.json";
import Apple from "../../assets/icons/Apple.svg"
import Google from "../../assets/icons/Google.svg"
import { createUser } from "api/api";
import { pendingUserState } from "global/authSlice";
import { showError } from "utils/toast";

const SignUp = () => {
  const [isSubmitting, setisSubmitting] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedArea, setSelectedArea]: any = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const scrollRef = useRef<any>(null);
  const phoneInputRef = useRef<any>(null);

  const dispatch = useDispatch();

  const Schema = yup.object({
    name: yup.string().required("Full Name must be filled"),
    email: yup.string().email().required("Email must be filled"),
    phone: yup
      .string()
      .required("Phone number is required")
      .matches(/^\d{10,10}$/, "Phone number must be 7 to 10 digits"),
    password: yup.string().min(6).required("Password must be filled"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match")
      .required("Confirm Password must be filled"),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(Schema) });

  const submit = (data: any) => {
    const FinalData = {
      name: data.name || data.fullName,
      password: data.password,
      email: data.email,
      phone: `${selectedArea?.dial_code || ''}${data.phone}`,
    };
    setisSubmitting(true);
    Keyboard.dismiss();
    createUser(FinalData).then((response) => {
      setisSubmitting(false);
      console.log("Registration successful:", response);
      dispatch(pendingUserState({email: data.email, phone: FinalData.phone, password: data.password, pending: true}));
      // router.push({pathname: "/(auth)/verifyOptions",
      //   params: { email: data.email,phone: FinalData.phone },
      // });
      Alert.alert("Success", "Registration successful! Please verify your account.", [
        {
          text: "OK",
          onPress: () => router.push({pathname: "/(auth)/verifyOptions",
            params: { email: data.email,phone: FinalData.phone },
          }),
        },
      ]);
    }).catch((error) => {
      setisSubmitting(false);
      const errorMessage = error?.message || "An error occurred. Please try again.";
      if(error?.code === "EMAIL_NOT_VERIFIED"){
        showError("U haven't been verified your email. Please verify to proceed.");
        setTimeout(() => {
          router.push({pathname: "/(auth)/verifyOptions",
            params: { email: error.details?.email,phone: error.details?.phone },
          });
        },2000)
        return;
      }else{
        // Alert.alert("Error", errorMessage);
        showError(errorMessage)
        return;
      }
    });
  };

  // Normalize countries and set default selection (Nigeria if available)
  useEffect(() => {
    const normalized = [...countryData].map((c: any) => {
      const root = c.idd?.root || "";
      const suffix = (c.idd?.suffixes && c.idd.suffixes[0]) || "";
      const dial_code = `${root}${suffix}`;
      const code = c.cca2 || "";
      const flag = code
        ? code
            .toUpperCase()
            .replace(/./g, (char: string) => String.fromCodePoint(127397 + char.charCodeAt(0)))
        : "";
      return { ...c, dial_code, flag };
    });
    normalized.sort((a: any, b: any) => {
      const A = (a.name?.common || "").toUpperCase();
      const B = (b.name?.common || "").toUpperCase();
      return A.localeCompare(B);
    });
    setAreas(normalized);
    const nigeria = normalized.find((a: any) => a.cca2 === "NG");
    setSelectedArea(nigeria || normalized[0] || {});
  }, []);
  const renderAreaCodeModal =()=>{
    const renderItem =({item}:any)=>{


      return(
        <TouchableOpacity
        className='font-NunitoSemiBold'
        onPress={()=>{
          setSelectedArea(item);
          setModalVisible(false);
        }}
        style={{
          padding: 10,
          flexDirection: "row",
          alignItems: "center"
        }}
        >
          {/* flag is an emoji string generated from cca2 */}
          <Text style={{ fontSize: 24 }}>{item.flag}</Text>
          <Text className="font-RalewayBold"  style={{color: "#ffffff", fontSize: 16 , marginLeft: 10}}>{item.name?.common} </Text>
        </TouchableOpacity>
      )
    }
    return(
      <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      >
        <StatusBar hidden/>
        <TouchableWithoutFeedback
        onPress={()=>setModalVisible(false)}
        >
          <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>

          <View className='bg-primary-100' style={{
            // backgroundColor: '#00000080',
            width: '100%',
            height: '100%',
          }}>
            <TouchableOpacity
            onPress={()=> setModalVisible(false)}
            style={{
              position: 'absolute',
              top: 20,
              right: 22,
              width: 42,
              height: 42,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: "white"
              
            }}
            >
              <Ionicons name="close-sharp" size={24} color="black" />
              
            </TouchableOpacity>

            <FlatList
            data={areas}
            renderItem={renderItem}
            keyExtractor={(item, index) => `item-${index}`}
            horizontal={false}
            style={{padding: 20, marginBottom: 20}}
            />

          </View>

          </View>
         

        </TouchableWithoutFeedback>
        

      </Modal>
      
    )
  }
  return (
    <GestureHandlerRootView>
      <KeyboardAvoidingView
        behavior={'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 20}
        className="w-full flex-1 bg-white h-screen p-5"
      >
            <View className="absolute">
          <Image source={require("../../assets/images/Bubbles.png")} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 220 }}>
    
        <View
          className="mt-12 *:items-center justify-center w-full mb-[50px]
      "
        >
          <TouchableOpacity className="mb-4" onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left-long" size={25} color="black" />
          </TouchableOpacity>
          <Text className="font-RalewayBold w-[70%] text-[50px]">
            Create Account
          </Text>
        </View>

        <View className="flex flex-col gap-[5px] ">
          <Controller
            name="name"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                title="name"
                onBlur={onBlur}
                value={value}
                handleChangeText={onChange}
                name="name"
                errors={errors}
                placeholder="Name"
                otherStyles="mt-[5px]"
              />
            )}
          />
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
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                title="Confirm Password"
                handleChangeText={onChange}
                onBlur={onBlur}
                value={value}
                errors={errors}
                name="confirmPassword"
                placeholder="Repeat Password"
              />
            )}
          />
            {/* Phone number field with country code and flag */}
          <View className="rounded-3xl  bg-[#F8F8F8]  h-16 px-4" style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <Text style={{ fontSize: 22 }}>{selectedArea?.flag}</Text>
              <Text className="font-NunitoSemiBold" style={{ marginLeft: 6 }}>{selectedArea?.dial_code}</Text>
              <Ionicons name="chevron-down" size={18} color="black" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
            <Controller
              name="phone"
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ flex: 1 }}>
                  <TextInput
                  ref={phoneInputRef}
                  className="font-NunitoMedium text-lg text-textColor-100"
                    value={value}
                    onFocus={() => {
                      // scroll a bit to ensure input is visible above keyboard
                      setTimeout(() => {
                        scrollRef.current?.scrollTo({ y: 250, animated: true });
                      }, 100);
                    }}
                    onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
                    onBlur={onBlur}
                    placeholder="Phone number"
                    placeholderTextColor={"#D2D2D2"}
                    keyboardType="number-pad"
                    maxLength={10}
                    style={{
                      borderColor: errors.phone ? 'red' : '#ccc',
                      borderRadius: 8,
                      padding: 10,
                      backgroundColor: 'transparent'
                    }}
                  />
                 
                </View>
              )}
            />
          </View>
           {errors.phone && <Text className="text-red-500 font-NunitoLight text-[13px]">{errors.phone.message}</Text>}
        </View>
        <View className="flex flex-1 justify-end flex-col  items-center mt-[10px]">
          <CustomButton
            title="Create an account"
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
            {renderAreaCodeModal()}
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
};

export default SignUp;
