import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../../constants/colors";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // ✅ HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 5,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
  fontSize: 20,        
  fontWeight: "800",
  color: COLORS.text,
  letterSpacing: -0.5,
},
userName: {
  fontSize: 16,       
  fontWeight: '800',
  color: COLORS.text,
  letterSpacing: -0.5,
},
  signOutBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  welcomeSection: {
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
});
