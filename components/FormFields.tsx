import { useState } from "react";
import { FieldErrors } from "react-hook-form";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons"



interface IData{
    title: string;
    value?: string;
    placeholder: string;
    handleChangeText?: (text: string) => void;
    otherStyles?: string;
    onBlur?: any;
    name?:string;
    errors?: FieldErrors<FieldErrors>;
}

const FormField:React.FC<IData> = ({
  title,
  value,
  onBlur,
  placeholder,
  handleChangeText,
  otherStyles,
  errors,
  name,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
    <View className={`space-y-1 ${otherStyles} mt-[15px]`}>


      <View className="w-full h-16 px-4 bg-black-100 rounded-3xl  bg-[#F8F8F8]  flex flex-row items-center">
        <TextInput
          className="flex-1 text-textcolor-100 rounded-2xl flex  font-NunitoSemiBold text-[16px]"
          value={value}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor="#D2D2D2"
          onChangeText={handleChangeText}
          secureTextEntry={(title === "Password" ) && !showPassword || title === "Reset Password" && !showPassword || (title === "Confirm Password" ) && !showPassword } 
          {...props}
        />
       

        {title === "Password" && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
           <View>
           {!showPassword ? <Icon name="eye" size={30} color="#868889"/> : <Icon name="eye-off" size={30} color="#868889"/>}
           </View>
          </TouchableOpacity>
        )}
        {title === "Reset Password" && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
           <View>
           {!showPassword ? <Icon name="eye" size={30} color="#868889"/> : <Icon name="eye-off" size={30} color="#868889"/>}
           </View>
          </TouchableOpacity>
        )}
        {title === "Confirm Password" && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
           <View>
           {!showPassword ? <Icon name="eye" size={30} color="#868889"/> : <Icon name="eye-off" size={30} color="#868889"/>}
           </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
     {errors && name && errors[name] && <Text className="text-red-500 font-NunitoLight text-[13px] mt-[10px]">{String(errors[name]?.message)}</Text>}
    </>
  );
};

export default FormField;