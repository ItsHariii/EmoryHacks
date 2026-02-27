```typescript
import React from 'react';

declare module 'react' {
  namespace JSX {
    interface ElementClass extends React.Component<any> {}
  }
}
```
