import { View, Text, Image } from "react-native";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { loginState, pendingUserLogout, selectPendingUser } from "global/authSlice";
import { loginUser } from "api/api";
import { showError } from "utils/toast";

const congratulation = () => {
  const select:any = useSelector(selectPendingUser)
  const dispatch = useDispatch()
  console.log(select)
  useEffect(() => {
    if( select === null ) {
       setTimeout(() => {
         router.replace("/(auth)/login");
         return;
    }, 5500);
    }
     else{
         loginUser({email: select?.email, password: select?.password}).then((response)=>{
          dispatch(pendingUserLogout())
          
        console.log("Logged in user:", response.data);
        dispatch(loginState(response.data));
      }).catch((error)=>{
        console.log("Login error:", error);
        dispatch(pendingUserLogout())
        showError("Login failed. Please try logging in again.");
      })
      }
   
  });
  return (
    <SafeAreaView className="flex flex-col items-center justify-center p-5 flex-1 bg-white ">
      <View className="absolute top-0">
        <Image source={require("../../assets/images/Bubbles.png")} />
      </View>
      <Image
        source={require("../../assets/images/congratulation.png")}
        className="w-80 h-80"
      />

      <View className="mt-10">
        <Text className="text-center self-center font-RalewayBold mt-4  text-[40px]">
          Congratulations
        </Text>
        <Text className="font-NunitoLight text-xl text-center self-center mt-4 w-[70%]">
          U have successfully registered as a user, Shop well
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default congratulation;
