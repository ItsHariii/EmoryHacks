import type { NavigatorScreenParams } from '@react-navigation/native';
import type {
  MealType,
  FoodItem,
  FoodEntry,
  JournalEntry,
} from '.';

export type FoodStackParamList = {
  SearchFood:
    | {
        mealType?: MealType;
        preselectedFood?: FoodItem;
        aiAnalysis?: unknown;
      }
    | undefined;
  FoodLoggingMain: undefined;
  EditFoodEntry: {
    entry?: FoodEntry;
    food?: FoodItem;
    mealType?: MealType;
    isNewEntry?: boolean;
  };
  BarcodeScanner:
    | {
        mealType?: MealType;
      }
    | undefined;
  AIPhotoAnalysis: undefined;
};

export type JournalStackParamList = {
  JournalMain: undefined;
  JournalEntry:
    | {
        entry?: JournalEntry;
      }
    | undefined;
  ChatJournal: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  FoodLogging: NavigatorScreenParams<FoodStackParamList>;
  Journal: NavigatorScreenParams<JournalStackParamList>;
  Baby: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  NotificationSettings: undefined;
  Profile: undefined;
};

