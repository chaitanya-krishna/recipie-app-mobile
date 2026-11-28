import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useClerk, useUser } from '@clerk/expo';
import { MealAPI } from "../../services/mealAPI";
import { homeStyles } from "../../assets/styles/home.styles";
import { Image } from "expo-image";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import CategoryFilter from "../../components/CategoryFilter";

const HomeScreen = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const [apiCategories, featuredMeal] = await Promise.all([
        MealAPI.getCategories(),
        MealAPI.getRandomMeal(),
      ]);

      const transformedCategories = apiCategories.map((cat, index) => ({
        id: index + 1,
        name: cat.strCategory,
        image: cat.strCategoryThumb,
        description: cat.strCategoryDescription,
      }));

      const preferredOrder = ['Dessert', 'Vegetarian', 'Vegan'];
      const lastOrder = ['Beef', 'Chicken', 'Lamb'];

      const preferred = preferredOrder
        .map(name => transformedCategories.find(cat => cat.name === name))
        .filter(Boolean);

      const last = lastOrder
        .map(name => transformedCategories.find(cat => cat.name === name))
        .filter(Boolean);

      const rest = transformedCategories.filter(
        cat => !preferredOrder.includes(cat.name) && !lastOrder.includes(cat.name)
      );

      const orderedCategories = [...preferred, ...rest, ...last];

      setCategories(orderedCategories);
      setSelectedCategory('Dessert');

      const transformedFeatured = MealAPI.transformMealData(featuredMeal);
      setFeaturedRecipe(transformedFeatured);

    } catch (error) {
      console.log("Error loading the data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }} edges={['top']}>
        <Text style={{ color: COLORS.textLight, fontSize: 16 }}>Loading delicious recipes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={homeStyles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={homeStyles.scrollContent}
      >
        {/* HEADER */}
        <View style={homeStyles.header}>
          <View>
            <Text style={homeStyles.welcomeText}>Hello,</Text>
            <Text style={homeStyles.userName}>
              {user?.emailAddresses[0]?.emailAddress?.split('@')[0]}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={homeStyles.signOutBtn}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* ANIMAL ICONS */}
        <View style={homeStyles.welcomeSection}>
          <Image
            source={require("../../assets/images/tomato.png")}
            style={{ width: 135, height: 135 }}
          />
          <Image
            source={require("../../assets/images/brinjal.png")}
            style={{ width: 135, height: 135 }}
          />
          <Image
            source={require("../../assets/images/pumpkin.png")}
            style={{ width: 130, height: 130 }}
          />
        </View>

        {/* FEATURED SECTION */}
        {featuredRecipe && (
          <View style={homeStyles.featuredSection}>
            <TouchableOpacity
              style={homeStyles.featuredCard}
              activeOpacity={0.9}
              onPress={() => router.push(`/recipe/${featuredRecipe.id}`)}
            >
              <View style={homeStyles.featuredImageContainer}>
                <Image
                  source={{ uri: featuredRecipe.image }}
                  style={homeStyles.featuredImage}
                  contentFit="cover"
                  transition={500}
                />
                <View style={homeStyles.featuredOverlay}>
                  <View style={homeStyles.featuredBadge}>
                    <Text style={homeStyles.featuredBadgeText}>Featured</Text>
                  </View>
                  <View style={homeStyles.featuredContent}>
                    <Text style={homeStyles.featuredTitle} numberOfLines={2}>
                      {featuredRecipe.title}
                    </Text>
                    <View style={homeStyles.featuredMeta}>
                      <View style={homeStyles.metaItem}>
                        <Ionicons name="time-outline" size={16} color={COLORS.white} />
                        <Text style={homeStyles.metaText}>{featuredRecipe.cookTime}</Text>
                      </View>
                      <View style={homeStyles.metaItem}>
                        <Ionicons name="people-outline" size={16} color={COLORS.white} />
                        <Text style={homeStyles.metaText}>{featuredRecipe.servings}</Text>
                      </View>
                      {featuredRecipe.area && (
                        <View style={homeStyles.metaItem}>
                          <Ionicons name="location-outline" size={16} color={COLORS.white} />
                          <Text style={homeStyles.metaText}>{featuredRecipe.area}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* CATEGORY FILTER */}
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
