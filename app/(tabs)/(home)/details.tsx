
    import {
      View,
      Text,
      Image,
      TouchableOpacity,
      SafeAreaView,
      ScrollView,
      Dimensions,
      NativeSyntheticEvent,
      NativeScrollEvent,
    } from 'react-native';
    import { useLocalSearchParams, router } from 'expo-router';
    import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, selectCartItems, increaseQuantity, decreaseQuantity } from 'global/listingSlice';
import { selectUser } from 'global/authSlice';

    const { width: SCREEN_WIDTH } = Dimensions.get('window');
    const CAROUSEL_HEIGHT = 300;

    const Details = () => {
      const dispatch = useDispatch();
      const cartItems = useSelector(selectCartItems);
      const selector:any = useSelector(selectUser)
      const params = useLocalSearchParams();
      const { id } = params as { id?: string };
      const scrollRef = useRef<ScrollView | null>(null);
      const [activeIndex, setActiveIndex] = useState(0);
      const [quantity, setQuantity] = useState(1);
      const {item}:any = useLocalSearchParams()

  const parseItems = JSON.parse(item)
  const cartItem = cartItems.find((ci:any) => ci.id === parseItems.id);

    const user = selector?.data?.user

      

      // Placeholder product data (replace with real data later)

      const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setActiveIndex(index);
      };

      return (
        <SafeAreaView className="flex-1 bg-white">
          {/* Carousel */}
          <View style={{ height: CAROUSEL_HEIGHT }}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onMomentumScrollEnd}
              style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}>
              {parseItems?.media
                ?.filter((img: any) => !parseItems.isDigital || img.mimeType === 'image/jpeg')
                .map((img:any) => (
                  <Image
                    key={img.id}
                    source={{uri:img.url}}
                    style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT }}
                    resizeMode="cover"
                  />
                ))}
            </ScrollView>

            {/* overlay buttons */}
            <TouchableOpacity
              className="absolute left-4 top-14 rounded-full bg-white p-2"
              onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </TouchableOpacity>
            <View className="absolute right-6 bottom-4 rounded-lg bg-primary-100 p-3 py-1">
              <Text className="text-white font-NunitoLight">Verified ID</Text>
            </View>

            {/* dots */}
            <View className="absolute left-0 right-0 -bottom-7 flex-row justify-center items-center">
              {parseItems?.media
                ?.filter((img: any) => !parseItems.isDigital || img.mimeType === 'image/jpeg')
                .map((i:any, inx:any) => (
                  <View
                    key={i?.id || inx}
                    style={{
                      width: i.id || inx === activeIndex ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      marginHorizontal: 4,
                      backgroundColor: i.id || inx === activeIndex ? '#2563EB' : '#E5E7EB',
                    }}
                  />
                ))}
            </View>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
            <View className="px-4 py-4">
              <Text className="text-2xl mt-6 font-RalewayBold">{parseItems.title}</Text>
              {/* <View className="flex-row items-center gap-3 mt-2">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={16} color="#FBBF24" />
                  <Text className="ml-1 font-NunitoSemiBold">{product.rating}</Text>
                </View>
                <Text className="ml-2 font-NunitoSemiBold">⭐ {product.likes}</Text>
                <Text className="ml-2 font-NunitoSemiBold">👍 {product.views}</Text>
              </View> */}

              <Text className="mt-4 text-gray-600 font-NunitoRegular">{parseItems.description}</Text>
              <View className="mt-6 flex flex-row gap-3 items-center">
                <View className=''>
                <Text className="text-lg font-RalewayMedium text-gray-500">Condition</Text>
                <Text className="mt-1 font-NunitoBold capitalize text-lg">{parseItems.condition}</Text>
              </View>

             <View className=' flex flex-row flex-wrap gap-2 justify-between '>
               {
                parseItems?.extraDetails.length > 0 && (
                  parseItems?.extraDetails?.map((details:any,index:number)=>(
                       <View key={index} className=' '>
                      <Text className='text-lg font-RalewayMedium text-gray-500'>{details.title}</Text>
                      <Text className='mt-1 font-NunitoBold capitalize text-lg'>{details.description}</Text>
                    </View>
                  ))
                )
              }
             </View>

             </View>

          

              <View className="mt-6">
               <View className='flex flex-row gap-4 mb-1'>
                 <Text className="font-NunitoBold text-lg text-textColor-100">Vendors Address</Text>
                <Text className=" font-NunitoBold text-lg">{parseItems?.seller?.vendorApplication.location?.city}, {parseItems?.seller?.vendorApplication.location?.country}</Text>
               </View>
                <Text className="text-gray-500 mt-1 font-NunitoLight">{parseItems?.seller?.vendorApplication.location?.Address}</Text>
              </View>

              <View className="mt-6 flex-row items-center  justify-between">
                <View className="flex-row items-center relative ">
                  <View className='bottom-0 z-30 righ-8 absolute rounded-full bg-green-500 border border-white p-1'/>
                  <Image source={{uri:parseItems?.seller?.kycDocument.selfieUrl}} className="w-12 h-12 rounded-full" />
                  <View className="ml-3">
                    <Text className="font-NunitoSemiBold text-lg">Vendor Profile</Text>
                    <Text className="text-sm text-gray-500 font-NunitoRegular">Name: {parseItems?.seller.name}</Text>
                    <Text className="text-sm font-NunitoRegular text-gray-500">Phone.No {parseItems?.seller.phone}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={()=>router.push({pathname: "/(tabs)/(profile)/chat", params: {seller: JSON.stringify(parseItems), user: JSON.stringify(user) }})} className="bg-primary-100 px-3 py-2 rounded-md">
                  <Text className="text-white font-NunitoSemiBold">Start Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* bottom bar */}
          <View className="absolute left-0 right-0 bottom-6 bg-white px-4 py-4 border-t border-gray-100 flex-row items-center justify-between">
            <View>
              <Text className="text-gray-500 font-RalewayMedium">Price</Text>
              <Text className="text-2xl font-RalewayBold mt-1 ">{parseItems?.price}</Text>
            </View>
            {cartItem ? (
              <View className="flex-row items-center bg-white rounded-lg">
                <TouchableOpacity
                  className="px-2 py-2 bg-primary-100 rounded-l-lg"
                  onPress={() => dispatch(decreaseQuantity(parseItems.id))}
                >
                  <Ionicons name="remove" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View className="px-4 py-2">
                  <Text className="text-lg font-NunitoBold">{cartItem.quantity}</Text>
                </View>
                <TouchableOpacity
                  className="px-2 py-2 bg-primary-100 rounded-r-lg"
                  onPress={() => dispatch(increaseQuantity(parseItems.id))}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="bg-primary-100 px-6 py-3 rounded-lg"
                onPress={() => dispatch(addToCart({
                  id: parseItems.id,
                  title: parseItems.title,
                  price: parseItems.price,
                  quantity,
                  media: parseItems.media,
                  seller: parseItems.seller,
                }))}
              >
                <Text className="text-white font-NunitoSemiBold">Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      );
    };

    export default Details;