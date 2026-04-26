// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { NutritionTargets } from '../types';

interface NutritionDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    targets?: NutritionTargets | null;
}

export const NutritionDetailsModal: React.FC<NutritionDetailsModalProps> = ({
    visible,
    onClose,
    targets,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={styles.modalContent}
                    onStartShouldSetResponder={() => true}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Nutrition Guide</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {/* Calorie Needs */}
                        <View style={styles.section}>
                            <View style={styles.sectionTitleRow}>
                                <MaterialCommunityIcons name="fire" size={20} color={theme.colors.primary} />
                                <Text style={styles.sectionHeader}>Daily Calorie Needs</Text>
                            </View>

                            {targets && (
                                <View style={styles.targetCard}>
                                    <Text style={styles.targetLabel}>Your Daily Target</Text>
                                    <Text style={styles.targetValue}>{Math.round(targets.calories)} kcal</Text>
                                </View>
                            )}

                            <View style={styles.infoBox}>
                                <Text style={styles.infoTitle}>General Guidelines</Text>
                                <View style={styles.row}>
                                    <Text style={styles.label}>1st Trimester:</Text>
                                    <Text style={styles.value}>No extra calories</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>2nd Trimester:</Text>
                                    <Text style={styles.value}>+340 kcal/day</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>3rd Trimester:</Text>
                                    <Text style={styles.value}>+450 kcal/day</Text>
                                </View>
                            </View>
                        </View>

                        {/* Macronutrients */}
                        <View style={styles.section}>
                            <View style={styles.sectionTitleRow}>
                                <MaterialCommunityIcons name="chart-pie" size={20} color={theme.colors.secondary} />
                                <Text style={styles.sectionHeader}>Macronutrients</Text>
                            </View>
                            <Text style={styles.sectionDescription}>
                                Balanced distribution for sustained energy and baby's growth.
                            </Text>

                            <View style={styles.macroRow}>
                                <View style={styles.macroItem}>
                                    <Text style={styles.macroLabel}>Protein</Text>
                                    <Text style={styles.macroValue}>25%</Text>
                                    <Text style={styles.macroSub}>Building blocks</Text>
                                </View>
                                <View style={styles.macroItem}>
                                    <Text style={styles.macroLabel}>Carbs</Text>
                                    <Text style={styles.macroValue}>45%</Text>
                                    <Text style={styles.macroSub}>Energy</Text>
                                </View>
                                <View style={styles.macroItem}>
                                    <Text style={styles.macroLabel}>Fats</Text>
                                    <Text style={styles.macroValue}>30%</Text>
                                    <Text style={styles.macroSub}>Brain dev</Text>
                                </View>
                            </View>
                        </View>

                        {/* Micronutrients */}
                        <View style={styles.section}>
                            <View style={styles.sectionTitleRow}>
                                <MaterialCommunityIcons name="pill" size={20} color={theme.colors.success} />
                                <Text style={styles.sectionHeader}>Key Micronutrients</Text>
                            </View>

                            <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientName}>Folic Acid (B9)</Text>
                                <Text style={styles.nutrientValue}>600 mcg</Text>
                                <Text style={styles.nutrientSource}>Prevents neural tube defects. Found in leafy greens, beans, citrus.</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientName}>Iron</Text>
                                <Text style={styles.nutrientValue}>27 mg</Text>
                                <Text style={styles.nutrientSource}>Supports increased blood volume. Found in red meat, spinach, fortified cereals.</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientName}>Calcium</Text>
                                <Text style={styles.nutrientValue}>1,000 mg</Text>
                                <Text style={styles.nutrientSource}>For baby's bones. Found in dairy, fortified plant milk.</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientName}>DHA (Omega-3)</Text>
                                <Text style={styles.nutrientValue}>200+ mg</Text>
                                <Text style={styles.nutrientSource}>Crucial for brain/eye development. Found in fatty fish (salmon), algae oil.</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                                <Text style={styles.nutrientName}>Choline</Text>
                                <Text style={styles.nutrientValue}>450 mg</Text>
                                <Text style={styles.nutrientSource}>Brain development. Found in eggs, meat, soy.</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        height: '85%',
        padding: theme.spacing.lg,
        ...theme.shadows.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        fontFamily: theme.typography.fontFamily.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    sectionHeader: {
        fontFamily: theme.typography.fontFamily.display,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    sectionDescription: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    targetCard: {
        backgroundColor: theme.colors.primary + '10', // 10% opacity
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        alignItems: 'center',
    },
    targetLabel: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: theme.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.semibold,
        marginBottom: 4,
    },
    targetValue: {
        fontFamily: theme.typography.fontFamily.display,
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
    },
    infoBox: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    infoTitle: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    label: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
    },
    value: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
    },
    macroItem: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    macroLabel: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    macroValue: {
        fontFamily: theme.typography.fontFamily.display,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
        marginBottom: 4,
    },
    macroSub: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    nutrientItem: {
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    nutrientName: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    nutrientValue: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.secondary,
        marginBottom: 4,
    },
    nutrientSource: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
});
