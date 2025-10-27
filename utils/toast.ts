import Toast from "react-native-toast-message";

export const showSuccess = (message: string) => {
  Toast.show({
    type: "success",
    text1: "Success",
    text2: message,
    position: "top",
  });
};

export const showError = (message: string) => {
  Toast.show({
    type: "error",
    text1: "Error",
    text2: message,
    position: "top",
  });
};
