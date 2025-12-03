import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

interface IData {
    title: string;
    handlePress?: () => void;
    handlePress1?: any;
    containerStyles?: string;
    textStyles?: string;
    isLoading?: boolean;
    disabled?: boolean;
  
}

const CustomButton:React.FC<IData> = ({
  title,
  handlePress,
  containerStyles,
  textStyles,
  handlePress1,
  isLoading,
  disabled
}) => {
  return (
    <TouchableOpacity
      onPress={handlePress || handlePress1}
      activeOpacity={0.7}
      className={`bg-primary-100 w-full rounded-xl min-h-[52px] flex flex-row justify-center items-center ${containerStyles} ${
        isLoading ? "opacity-50" : ""
      }`}
      disabled={isLoading || disabled}
      
    >
      <Text className={`text-white  font-RalewayBold text-lg ${textStyles}`}>
        {title}
      </Text>

      {(isLoading) && (
        <ActivityIndicator
          animating={isLoading}
          color="#fff"
          size="small"
          className="ml-2"
        />
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;