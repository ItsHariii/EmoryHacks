import React from 'react';
import { render } from '@testing-library/react-native';
import { SkeletonMacroCard } from '../SkeletonLoader';

describe('SkeletonLoader', () => {
    it('exports SkeletonMacroCard', () => {
        expect(SkeletonMacroCard).toBeDefined();
    });

    it('renders SkeletonMacroCard correctly', () => {
        const { toJSON } = render(<SkeletonMacroCard />);
        expect(toJSON()).toBeTruthy();
    });
});
