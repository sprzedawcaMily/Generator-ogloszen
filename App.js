import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const createAd = () => {
    if (!title || !description || !price) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }

    Alert.alert(
      'Sukces',
      `Ogłoszenie "${title}" zostało utworzone!\nCena: ${price} zł`,
      [{ text: 'OK' }]
    );

    // Reset form
    setTitle('');
    setDescription('');
    setPrice('');
    setImages([]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Aplikacja do Ogłoszeń</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>Tytuł ogłoszenia:</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Wprowadź tytuł..."
          />

          <Text style={styles.label}>Opis:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Wprowadź opis..."
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Cena (zł):</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>Dodaj zdjęcie</Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <View style={styles.imageContainer}>
              {images.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.image} />
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={createAd}>
            <Text style={styles.submitButtonText}>Utwórz Ogłoszenie</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});