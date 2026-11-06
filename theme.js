import { StyleSheet, Platform } from 'react-native';

export const colors = {
  cream: '#FFF9E9',
  yellow: '#FFD45C',
  yellowLight: '#FFF0BC',
  navy: '#10234B',
  white: '#FFFFFF',
  gray: '#898989',
  border: '#E7DFCE',
  red: '#C94D50',
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  webContainer: {
    flex: 1,
    backgroundColor: '#EBE5D6',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  phoneContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.cream,
    ...Platform.select({
      web: {
        maxHeight: '100vh',
        boxShadow: '0px 10px 40px rgba(16, 35, 75, 0.16)',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border,
      },
      default: {},
    }),
  },
  page: { flex: 1, backgroundColor: colors.cream },
  content: { flexGrow: 1, padding: 20, paddingBottom: 25 },
  title: { fontSize: 29, fontWeight: '900', color: colors.navy },
  subtitle: { fontSize: 14, color: colors.navy, marginTop: 7 },
  input: {
    height: 52, borderWidth: 1.3, borderColor: colors.border,
    backgroundColor: colors.white, borderRadius: 13,
    paddingHorizontal: 15, marginBottom: 13, color: colors.navy,
  },
  button: {
    minHeight: 54, backgroundColor: colors.yellow, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    marginVertical: 8, paddingHorizontal: 15,
  },
  buttonText: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  eventCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 16,
    padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  eventImage: {
    width: 76, height: 82, borderRadius: 12,
    backgroundColor: colors.yellowLight,
    alignItems: 'center', justifyContent: 'center',
  },
  nav: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 7, borderTopWidth: 1,
    borderColor: colors.border, backgroundColor: colors.cream,
  },
  navButton: {
    alignItems: 'center', justifyContent: 'center',
    padding: 7, borderRadius: 28, minWidth: 76,
  },
  navActive: { backgroundColor: colors.yellow },
});
