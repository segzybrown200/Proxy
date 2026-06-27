import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
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
  },
  {
    key: "s2",
    title: "Secure",
    highlight: "Payment",
    subtitle: "Safe and fast payment options with multiple methods to choose from.",
  },
  {
    key: "s3",
    title: "Fast & Easy",
    highlight: "Shopping",
    subtitle: "Browse, buy, and get your items delivered or picked up quickly.",
  },
  {
    key: "s4",
    title: "Also Start",
    highlight: "Selling",
    subtitle: "Turn your items into cash. List products and earn from thousands of buyers.",
  },
];

const backgroundVideo = require('../../assets/Proxy.mp4');
const fallbackVideo = "https://res.cloudinary.com/doemqvrzy/video/upload/v1771377240/Proxy_Video_2_loxnuo.mp4";

const Onboarding = () => {
  const [index, setIndex] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // Create video player with local video first
  const player = useVideoPlayer(backgroundVideo, (player) => {
    player.loop = true;
    player.muted = true;
  });

  // Fallback player for remote video
  const fallbackPlayer = useVideoPlayer(fallbackVideo, (player) => {
    player.loop = true;
    player.muted = true;
  });

  useEffect(() => {
    if (!player) return;

    // Listen to status changes for local video
    const subscription = player.addListener('statusChange', (status) => {
      if (status.status === 'readyToPlay') {
        setIsVideoReady(true);
        if (!player.playing) {
          player.play();
        }
      } else if (status.status === 'error') {
        // Local video failed, try fallback
        console.log('Local video failed, switching to remote video');
        setUsingFallback(true);
        setVideoError(false);
        if (fallbackPlayer) {
          fallbackPlayer.play();
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [player, fallbackPlayer]);

  // Handle fallback video status
  useEffect(() => {
    if (!fallbackPlayer || !usingFallback) return;

    const fallbackSubscription = fallbackPlayer.addListener('statusChange', (status) => {
      if (status.status === 'readyToPlay') {
        setIsVideoReady(true);
        if (!fallbackPlayer.playing) {
          fallbackPlayer.play();
        }
      } else if (status.status === 'error') {
        setVideoError(true);
      }
    });

    return () => {
      fallbackSubscription?.remove();
    };
  }, [fallbackPlayer, usingFallback]);

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
      router.push("/(auth)/choose-role");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Background Video - Plays continuously */}
      <View style={{ position: "absolute", width: "100%", height: "100%", overflow: "hidden" }}>
        <VideoView
          player={usingFallback ? fallbackPlayer : player}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          nativeControls={false}
        />
        
        {/* Loading indicator while video buffers */}
        {!isVideoReady && !videoError && (
          <View style={{ position: "absolute", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text className="text-white mt-4 font-NunitoRegular">Loading video...</Text>
          </View>
        )}

        {/* Fallback overlay if video fails */}
        {videoError && (
          <View style={{ position: "absolute", width: "100%", height: "100%", backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" }}>
            <Text className="text-white font-NunitoRegular text-center px-8">
              Video unavailable. Enjoy the onboarding experience!
            </Text>
          </View>
        )}
      </View>

      {/* Slides on top of video */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        <StatusBar style="light" />
        {slides.map((slide) => (
          <View key={slide.key} style={{ width, flex: 1 }}>
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
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Onboarding;
