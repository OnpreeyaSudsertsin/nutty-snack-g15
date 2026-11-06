import { Platform, Alert } from 'react-native';

export const showAlert = (title, message = '', buttons) => {
  if (Platform.OS === 'web') {
    const fullText = title ? (message ? `${title}\n\n${message}` : title) : message;
    if (buttons && buttons.length > 1) {
      // Find destructive or action button
      const actionBtn = buttons.find((b) => b.style === 'destructive') || buttons[buttons.length - 1];
      const cancelBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
      const result = window.confirm(fullText);
      if (result) {
        if (actionBtn?.onPress) actionBtn.onPress();
      } else {
        if (cancelBtn?.onPress) cancelBtn.onPress();
      }
    } else {
      window.alert(fullText);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
