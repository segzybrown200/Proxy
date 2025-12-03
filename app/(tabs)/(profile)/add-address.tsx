import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Ionicons from 'react-native-vector-icons/Ionicons'

// Replace with your Google Places API key or wire it from secure env
const GOOGLE_PLACES_API_KEY = 'AIzaSyCLCcDMey2l91ZTwuT3avheF5R85-klUcM' // <YOUR_GOOGLE_PLACES_API_KEY>

type Suggestion = {
  place_id: string
  description: string
}


type AddressCoords = {
  latitude?: number;
  longitude?: number;
};

const AddAddress = () => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [coords, setCoords] = useState<AddressCoords>({});
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!query) {
      setSuggestions([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 400)
  }, [query])

  const success = ()=>{
    Alert.alert('Address saved', `Address "${query}" saved successfully.`)
    router.back()
  }

  const fetchSuggestions = async (text: string) => {
    if (!GOOGLE_PLACES_API_KEY) {
      // Don't attempt network requests without an API key
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${GOOGLE_PLACES_API_KEY}&components=country:ng`

      const res = await fetch(url)
      const json = await res.json()
      if (json.status === 'OK' && Array.isArray(json.predictions)) {
        const items: Suggestion[] = json.predictions.map((p: any) => ({ place_id: p.place_id, description: p.description }))
        setSuggestions(items)
      } else {
        setSuggestions([])
      }
    } catch (e) {
      console.warn('Places autocomplete failed', e)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const selectSuggestion = async (s: Suggestion) => {
    // Fetch place details to get coordinates
    try {
      setLoading(true);
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${s.place_id}&key=${GOOGLE_PLACES_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK' && json.result && json.result.geometry && json.result.geometry.location) {
        setCoords({
          latitude: json.result.geometry.location.lat,
          longitude: json.result.geometry.location.lng,
        });
      } else {
        setCoords({});
      }
    } catch (e) {
      setCoords({});
    } finally {
      setQuery(s.description);
      setSuggestions([]);
      setLoading(false);
    }
  }

  const saveAddress = async () => {
    if (!query.trim()) {
      Alert.alert('Address required', 'Please enter an address before saving.')
      return
    }

    try {
      const key = 'addresses'
      const raw = await AsyncStorage.getItem(key)
      const existing: Array<any> = raw ? JSON.parse(raw) : []
      const newEntry = {
        id: Date.now().toString(),
        address: query.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        createdAt: new Date().toISOString(),
      }
      const updated = [newEntry, ...existing]
      await AsyncStorage.setItem(key, JSON.stringify(updated))
      // navigate back to address list — it will read AsyncStorage on mount
      router.back()
    } catch (e) {
      console.warn('Saving address failed', e)
      Alert.alert('Save failed', 'Unable to save address. Please try again.')
    }
  }

  const useCurrentLocation = async () => {
    let Location: any
    try {
      setLoading(true)
      // dynamic import so expo-location is optional for the project
      Location = await import('expo-location')
    } catch (e) {
      console.warn('expo-location not available', e)
      Alert.alert('Current location', 'Install expo-location to use this feature.')
      setLoading(false)
      return
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Location permission', 'Please allow location permission to use current location.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open settings', onPress: () => Linking.openSettings() },
        ])
        setLoading(false)
        return
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest })
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const rev = await Location.reverseGeocodeAsync(pos.coords)
      if (rev && rev.length > 0) {
        const r = rev[0]
        // Build a robust address from available fields
        const parts = [r.name, r.street, r.subregion || r.city, r.region, r.postalCode, r.country].filter(Boolean)
        const addr = parts.join(', ')
        setQuery(addr)
        setSuggestions([])
      } else {
        Alert.alert('Location', 'Unable to determine address from your location.')
      }
    } catch (e) {
      console.warn('Current location failed', e)
      Alert.alert('Current location', 'Unable to get current location. Make sure location services are enabled.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 p-5 bg-white">
      <View className="flex-row items-center mt-10">
        <TouchableOpacity onPress={() => router.back()} className="bg-[#ECF0F4] rounded-full p-2 mr-3">
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>

        <Text className="text-2xl RalewayBold">Add Address</Text>
      </View>

      <View className="mt-6 px-1">
        <Text className="text-xl font-RalewayMedium text-gray-600 mb-4">Search address</Text>
        <View className="flex-row items-center">
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Start typing address"
            className="flex-1 px-3 py-4 font-RalewayLight text-lg bg-gray-100 rounded-3xl"
          />
        </View>

        <View className="flex-row mt-8">
          <TouchableOpacity onPress={useCurrentLocation} className="bg-primary-100 px-3 py-2 rounded-md mr-2">
            <Text className="text-white text-lg font-NunitoMedium">Use current location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!GOOGLE_PLACES_API_KEY) Alert.alert('API key required', 'Please set your Google Places API key in the file to use autocomplete.')
              else fetchSuggestions(query)
            }}
            className="bg-white px-3 py-2 rounded-md border border-gray-200"
          >
            <Text className='text-primary-100 font-RalewayMedium text-lg'>Search</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="mt-3">
            <ActivityIndicator />
          </View>
        ) : null}

        {suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            keyExtractor={(i) => i.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectSuggestion(item)} className="py-3 border-b border-gray-100">
                <Text className="text-base font-NunitoRegular">{item.description}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ marginTop: 8 }}
          />
        ) : null}

        {/* Save button */}
      </View>

      {query ? (
        <View className="px-5 mt-auto mb-10">
          <TouchableOpacity
            onPress={saveAddress}
            className="bg-primary-100 rounded-lg p-4 items-center"
          >
            <Text className="text-white text-lg font-NunitoBold">Save Address</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  )
}

export default AddAddress
