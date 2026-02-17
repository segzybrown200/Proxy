import React, { useRef, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from "react-native";
import CustomButton from "../../components/CustomButton";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

const slides = [
  {
    key: "s1",
    title: "Discover Local",
    highlight: "Marketplace",
    subtitle: "Find sellers, compare prices and get fast pickup or delivery from nearby vendors.",
    image: "https://plus.unsplash.com/premium_photo-1683746792239-6ce8cdd3ac78?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    key: "s2",
    title: "Secure",
    highlight: "Payment",
    subtitle: "Safe and fast payment options with multiple methods to choose from.",
    image: "https://plus.unsplash.com/premium_vector-1720931652710-7bfbe41ae29a?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    key: "s3",
    title: "Fast & Easy",
    highlight: "Shopping",
    subtitle: "Browse, buy, and get your items delivered or picked up quickly.",
    image: "https://plus.unsplash.com/premium_vector-1746389251501-cb01c4aaf304?q=80&w=742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const Onboarding = () => {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  const handleVisitor = () => router.push({ pathname: "/(auth)/location", params: { visitor: "true" } });

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / width);
    setIndex(idx);
  };

  const goNext = () => {
    if (index < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
    } else {
      router.push("/(auth)/register");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
      <StatusBar style="light" />
        {slides.map((slide) => (
          <ImageBackground
            key={slide.key}
            source={{ uri: slide.image }}
            style={{ width, flex: 1 }}
            resizeMode="cover"
          >
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}>
              <SafeAreaView className="flex-1">
                <View className="flex-row items-center justify-between px-6 pt-6">
                  <View className="flex-1" />
                  <TouchableOpacity onPress={handleVisitor}>
                    <Text className="text-white mt-10 font-RalewayMedium text-xl underline">Continue as Visitor</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-1 items-center justify-center px-8">
                  <Text className="text-white font-RalewayBold text-4xl text-center">
                    {slide.title} <Text className="text-green-400">{slide.highlight}</Text>
                  </Text>
                  <Text className="text-white/80 mt-4 text-center font-NunitoLight text-base">
                    {slide.subtitle}
                  </Text>
                </View>

                <View className="px-8 pb-12">
                  {/* pagination dots */}
                  <View className="flex-row justify-center items-center mb-6">
                    {slides.map((_, i) => (
                      <View
                        key={`dot-${i}`}
                        className={`mx-1.5 ${
                          i === index ? "w-8 h-2 bg-white rounded-full" : "w-2 h-2 bg-white/40 rounded-full"
                        }`}
                      />
                    ))}
                  </View>

                  <CustomButton
                    title={index === slides.length - 1 ? "Get Started" : "Next"}
                    handlePress={goNext}
                  />

                  <TouchableOpacity onPress={() => router.push("/(auth)/login")} className="mt-4 flex-row justify-center items-center">
                    <Text className="text-white/80 font-NunitoBold">Already have account? </Text>
                    <Text className="text-white font-NunitoSemiBold"> Login here</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </ImageBackground>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Onboarding;
