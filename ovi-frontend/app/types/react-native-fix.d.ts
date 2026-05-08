// React 19 + RN 0.81 type compat shim.
// RN's class components are declared with a `Constructor<NativeMethods>`
// intersection that React 19's stricter JSX validity check rejects, surfacing
// as TS2607 / TS2786 ("X cannot be used as a JSX component"). Extending each
// class's interface so its instance type satisfies `React.Component<any,any,any>`
// makes JSX accept it again. Also re-exposes `defaultProps` on Text/TextInput
// since React 19 dropped it from function-component types and TS strips it
// from RN's class types as a side effect.

import 'react-native';

declare module 'react-native' {
  interface View extends React.Component<any, any, any> {}
  interface Text extends React.Component<any, any, any> {}
  interface TextInput extends React.Component<any, any, any> {}
  interface ActivityIndicator extends React.Component<any, any, any> {}
  interface ScrollView extends React.Component<any, any, any> {}
  interface FlatList<ItemT = any> extends React.Component<any, any, any> {}
  interface SectionList<ItemT = any> extends React.Component<any, any, any> {}
  interface Image extends React.Component<any, any, any> {}
  interface Modal extends React.Component<any, any, any> {}
  interface Switch extends React.Component<any, any, any> {}
  interface RefreshControl extends React.Component<any, any, any> {}
  interface KeyboardAvoidingView extends React.Component<any, any, any> {}
  interface TouchableOpacity extends React.Component<any, any, any> {}
  interface TouchableHighlight extends React.Component<any, any, any> {}
  interface TouchableWithoutFeedback extends React.Component<any, any, any> {}
  interface TouchableNativeFeedback extends React.Component<any, any, any> {}
  interface Pressable extends React.Component<any, any, any> {}
  interface Animated extends React.Component<any, any, any> {}
  interface VirtualizedList<ItemT = any> extends React.Component<any, any, any> {}

  namespace Text {
    let defaultProps: { style?: any } | undefined;
  }
  namespace TextInput {
    let defaultProps: { style?: any } | undefined;
  }
}
