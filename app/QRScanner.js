import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const scale = (size) => (width / 375) * size;
const verticalScale = (size) => (height / 812) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function QRScanner({ onQRCodeScanned, onClose }) {
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);

  const handleBarCodeScanned = ({ type, data }) => {
    // Triple protection against multiple calls
    if (scanned || !isScanning || hasProcessed) {
      return;
    }

    setScanned(true);
    setIsScanning(false);
    setHasProcessed(true); // Mark as processed

    try {
      const parsedData = JSON.parse(data);
      if (
        parsedData &&
        parsedData.address?.startsWith("0x") &&
        parsedData.address.length === 66
      ) {
        onQRCodeScanned(parsedData.address, parsedData.amount);
      } else {
        Alert.alert(
          "Invalid QR Code",
          "The scanned QR code does not contain a valid Starknet wallet address.",
          [
            {
              text: "Try Again",
              onPress: () => {
                setScanned(false);
                setIsScanning(true);
                setHasProcessed(false);
              },
            },
            { text: "Cancel", onPress: onClose },
          ]
        );
      }
    } catch (error) {
      console.error("Error parsing QR code data:", error);
      Alert.alert(
        "Invalid QR Code",
        "The scanned QR code format is not valid.",
        [
          {
            text: "Try Again",
            onPress: () => {
              setScanned(false);
              setIsScanning(true);
              setHasProcessed(false);
            },
          },
          { text: "Cancel", onPress: onClose },
        ]
      );
    }
  };

  if (!permission) {
    // Camera permissions are still loading.
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isScanning && !scanned && !hasProcessed ? (
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
        />
      ) : (
        <View style={styles.camera} />
      )}

      {/* Overlay positioned absolutely */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <MaterialIcons name="arrow-back" size={24} color="#EAE5DC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanFrame}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Position the QR code within the frame
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(20),
  },
  backButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#EAE5DC",
    fontSize: moderateScale(18),
    fontWeight: "600",
  },
  placeholder: {
    width: moderateScale(40),
  },
  scanFrame: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: moderateScale(250),
    height: moderateScale(250),
    marginLeft: moderateScale(-125),
    marginTop: moderateScale(-125),
  },
  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: moderateScale(30),
    height: moderateScale(30),
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#EAE5DC",
  },
  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: moderateScale(30),
    height: moderateScale(30),
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#EAE5DC",
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: moderateScale(30),
    height: moderateScale(30),
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#EAE5DC",
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: moderateScale(30),
    height: moderateScale(30),
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#EAE5DC",
  },
  instructions: {
    position: "absolute",
    bottom: verticalScale(120),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionsText: {
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  text: {
    color: "#EAE5DC",
    fontSize: moderateScale(16),
    textAlign: "center",
    marginTop: verticalScale(200),
  },
  button: {
    backgroundColor: "#EAE5DC",
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(20),
    alignSelf: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
});
