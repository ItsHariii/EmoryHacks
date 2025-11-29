import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { CameraPermissionScreen } from '../components/CameraPermissionScreen';
import { photoAPI } from '../services/api';
import { FoodSafetyBadge } from '../components/FoodSafetyBadge';

export const AIPhotoAnalysisScreen: React.FC = () => {
  const navigation = useNavigation();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      setCapturedPhoto(photo.uri);
      
      // Automatically start analysis
      await analyzePhoto(photo.uri);
    } catch (err: any) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const analyzePhoto = async (photoUri: string) => {
    setAnalyzing(true);
    setError(null);
    
    try {
      // Send to backend for analysis (skipping compression for now)
      const result = await photoAPI.analyzePhoto(photoUri);
      
      if (result.success) {
        setAnalysisResult(result);
      } else {
        setError(result.error || 'Failed to analyze photo');
      }
    } catch (err: any) {
      console.error('Error analyzing photo:', err);
      setError(err.message || 'Failed to analyze photo. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleLogFood = () => {
    if (!analysisResult?.food) return;
    
    // Navigate to SearchFood with the analyzed food pre-selected
    (navigation as any).navigate('SearchFood', {
      preselectedFood: analysisResult.food,
      aiAnalysis: analysisResult.ai_analysis,
    });
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // Show permission screens
  if (!permission) {
    return <CameraPermissionScreen loading onRequestPermission={requestPermission} onGoBack={handleCancel} />;
  }

  if (!permission.granted) {
    return <CameraPermissionScreen denied onRequestPermission={requestPermission} onGoBack={handleCancel} />;
  }

  // Show analysis results
  if (analysisResult && capturedPhoto) {
    const { ai_analysis, food } = analysisResult;
    
    return (
      <View style={styles.container}>
        <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Analysis Results</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Photo Preview */}
          <Image source={{ uri: capturedPhoto }} style={styles.photoPreview} />

          {/* AI Analysis */}
          <View style={styles.section}>
            <View style={styles.foodHeader}>
              <MaterialCommunityIcons name="food-apple" size={32} color={theme.colors.primary} />
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{ai_analysis.food_name}</Text>
                <Text style={styles.confidence}>
                  {ai_analysis.confidence}% confidence
                </Text>
              </View>
            </View>

            {/* Safety Badge */}
            {food.safety_status && (
              <View style={styles.safetyContainer}>
                <FoodSafetyBadge
                  status={food.safety_status}
                  notes={food.safety_notes}
                />
              </View>
            )}

            {/* Portion Estimate */}
            {ai_analysis.estimated_portion_size && (
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Estimated Portion</Text>
                <Text style={styles.infoValue}>
                  {ai_analysis.estimated_portion_size} {ai_analysis.estimated_portion_unit}
                </Text>
              </View>
            )}

            {/* Nutrition Info */}
            <View style={styles.nutritionCard}>
              <Text style={styles.sectionTitle}>Nutrition (per {food.serving_size}{food.serving_unit})</Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                  <Text style={styles.nutritionValue}>{Math.round(food.calories)}</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                  <Text style={styles.nutritionValue}>{food.nutrients.protein.amount}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                  <Text style={styles.nutritionValue}>{food.nutrients.carbs.amount}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                  <Text style={styles.nutritionValue}>{food.nutrients.fat.amount}g</Text>
                </View>
              </View>
            </View>

            {/* Ingredients */}
            {ai_analysis.detected_ingredients && ai_analysis.detected_ingredients.length > 0 && (
              <View style={styles.ingredientsCard}>
                <Text style={styles.sectionTitle}>Detected Ingredients</Text>
                <View style={styles.ingredientsList}>
                  {ai_analysis.detected_ingredients.map((ingredient: string, index: number) => (
                    <View key={index} style={styles.ingredientChip}>
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Pregnancy Concerns */}
            {ai_analysis.pregnancy_concerns && ai_analysis.pregnancy_concerns.length > 0 && (
              <View style={styles.warningCard}>
                <MaterialCommunityIcons name="alert" size={20} color={theme.colors.warning} />
                <Text style={styles.warningText}>
                  {ai_analysis.pregnancy_concerns.join(', ')}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <MaterialCommunityIcons name="camera-retake" size={20} color={theme.colors.text.secondary} />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logButton} onPress={handleLogFood}>
            <Text style={styles.logButtonText}>Log This Food</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show error state
  if (error && capturedPhoto) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.errorPhoto} />
          <MaterialCommunityIcons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Text style={styles.retakeButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.manualButton} onPress={() => {
              navigation.goBack();
              (navigation as any).navigate('SearchFood');
            }}>
              <Text style={styles.manualButtonText}>Manual Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Show analyzing state
  if (analyzing && capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto }} style={styles.analyzingPhoto} />
        <View style={styles.analyzingOverlay}>
          <View style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.analyzingText}>Analyzing your food...</Text>
            <Text style={styles.analyzingSubtext}>This may take a few seconds</Text>
          </View>
        </View>
      </View>
    );
  }

  // Show camera view
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        facing="back"
        style={StyleSheet.absoluteFillObject}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <MaterialCommunityIcons name="camera-iris" size={48} color={theme.colors.surface} />
          <Text style={styles.instructionsTitle}>AI Food Analysis</Text>
          <Text style={styles.instructionsText}>
            Position your food in the frame and take a photo
          </Text>
        </View>

        {/* Capture Button */}
        <View style={styles.captureContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cancelButton: {
    position: 'absolute',
    top: 50,
    left: theme.spacing.lg,
    backgroundColor: 'rgba(128, 0, 0, 0.8)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  cancelButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginTop: 120,
    paddingHorizontal: theme.spacing.xl,
  },
  instructionsTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  instructionsText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.surface,
    textAlign: 'center',
    opacity: 0.9,
  },
  captureContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.surface,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
  },
  analyzingPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    minWidth: 250,
  },
  analyzingText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  analyzingSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  resultsContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  photoPreview: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  section: {
    padding: theme.spacing.lg,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  foodInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  foodName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  confidence: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  safetyContainer: {
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  nutritionCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  nutritionValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  ingredientsCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  ingredientChip: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  ingredientText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.warning,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  retakeButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.semibold,
  },
  logButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.bold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  errorPhoto: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  manualButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  manualButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.inverse,
    fontWeight: theme.fontWeight.semibold,
  },
});
