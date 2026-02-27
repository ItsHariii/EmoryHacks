// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { HeaderBar } from '../components/layout/HeaderBar';
import { Button } from '../components/ui/Button';
import { theme } from '../theme';
import { CameraPermissionScreen } from '../components/camera/CameraPermissionScreen';
import { photoAPI } from '../services/api';
import { FoodSafetyBadge } from '../components/food/FoodSafetyBadge';

const CaptureButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);
  return (
    <TouchableOpacity style={styles.captureButton} onPress={onPress} activeOpacity={0.9}>
      <Animated.View style={[styles.captureButtonInner, { transform: [{ scale }] }]} />
    </TouchableOpacity>
  );
};

export const AIPhotoAnalysisScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
      <ScreenWrapper edges={['bottom']}>
        <HeaderBar
          title="Analysis Results"
          showBack
          onBack={handleCancel}
        />
        <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
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
            <MaterialCommunityIcons name="camera-retake" size={theme.iconSize.md} color={theme.colors.text.secondary} />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logButton} onPress={handleLogFood}>
            <Text style={styles.logButtonText}>Log This Food</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // Show error state
  if (error && capturedPhoto) {
    return (
      <ScreenWrapper>
        <View style={styles.errorContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.errorPhoto} />
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={theme.iconSize.massive} color={theme.colors.error} />
            <Text style={styles.errorTitle}>Analysis Failed</Text>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
          <View style={styles.errorButtons}>
            <Button title="Try Again" onPress={handleRetake} variant="outline" style={styles.errorButton} />
            <Button
              title="Manual Search"
              onPress={() => {
                navigation.goBack();
                (navigation as any).navigate('SearchFood');
              }}
              style={styles.errorButton}
            />
          </View>
        </View>
      </ScreenWrapper>
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
        <TouchableOpacity
          style={[styles.cancelButton, { top: insets.top + 10 }]}
          onPress={handleCancel}
        >
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
          <CaptureButton onPress={handleTakePhoto} />
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
    left: theme.layout.screenPadding,
    backgroundColor: theme.colors.cameraOverlay,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.sm,
  },
  cancelButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginTop: 120,
    paddingHorizontal: theme.spacing.xxl,
  },
  instructionsTitle: {
    ...theme.typography.presets.heading3,
    color: theme.colors.text.inverse,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  instructionsText: {
    ...theme.typography.presets.body,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.inverse,
    opacity: theme.opacity.medium,
    textAlign: 'center',
  },
  captureContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.text.inverse,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.text.inverse,
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
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    minWidth: 280,
    ...theme.shadows.card,
  },
  analyzingText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
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
    paddingBottom: 120,
  },
  photoPreview: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.card,
    marginHorizontal: theme.layout.screenPadding,
    marginTop: theme.spacing.md,
    overflow: 'hidden',
  },
  section: {
    padding: theme.layout.screenPadding,
    marginTop: -theme.spacing.xl,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.layout.cardPadding,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  foodInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  foodName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  confidence: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },
  safetyContainer: {
    marginBottom: theme.spacing.lg,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.layout.cardPadding,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.fontWeight.medium,
  },
  infoValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  nutritionCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.layout.cardPadding,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
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
    backgroundColor: theme.colors.surfaceHighlight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  nutritionLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.bold,
  },
  nutritionValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  ingredientsCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.layout.cardPadding,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  ingredientChip: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  ingredientText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning,
    padding: theme.layout.cardPadding,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.warningDark,
  },
  warningText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.warningDark,
    lineHeight: 20,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: theme.layout.screenPadding,
    paddingBottom: 40,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    gap: theme.spacing.md,
    ...theme.shadows.lg,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  retakeButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.bold,
  },
  logButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.layout.minTouchTarget,
    ...theme.shadows.lg,
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
    padding: theme.layout.screenPadding,
    backgroundColor: theme.colors.background,
  },
  errorPhoto: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.layout.cardPadding,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
    width: '100%',
    maxWidth: 320,
    ...theme.shadows.card,
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
    lineHeight: 24,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
    maxWidth: 320,
  },
  errorButton: {
    flex: 1,
  },
});
