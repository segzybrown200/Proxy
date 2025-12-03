import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Step {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface ProgressStepsProps {
  currentStep: number;
  steps: Step[];
}

const ProgressSteps = ({ currentStep, steps }: ProgressStepsProps) => {
  return (
    <View className="px-4 py-3 bg-white">
      <View className="flex-row justify-between items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.title}>
            {/* Step Circle */}
            <View
              className={`items-center justify-center rounded-full w-10 h-10 
                ${
                  index < currentStep
                    ? "bg-green-500"
                    : index === currentStep
                    ? "bg-primary-100"
                    : "bg-gray-200"
                }`}
            >
              <MaterialCommunityIcons
                name={step.icon}
                size={20}
                color="white"
              />
            </View>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <View
                className={`flex-1 h-1 
                  ${
                    index < currentStep
                      ? "bg-green-500"
                      : index === currentStep
                      ? "bg-primary-100"
                      : "bg-gray-200"
                  }`}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Step Titles */}
      <View className="flex-row justify-between mt-2">
        {steps.map((step, index) => (
          <Text
            key={step.title}
            className={`text-xs text-center font-NunitoSemiBold flex-1 
              ${
                index < currentStep
                  ? "text-green-500"
                  : index === currentStep
                  ? "text-primary-100"
                  : "text-gray-400"
              }`}
          >
            {step.title}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default ProgressSteps;