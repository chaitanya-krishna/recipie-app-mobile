const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

export const MealAPI = {
  getRandomMeal: async () => {
    try {
      const response = await fetch(`${BASE_URL}/random.php`);
      const data = await response.json();
      return data.meals ? data.meals[0] : null;
    } catch (error) {
      console.error("Error getting random meal:", error);
      return null;
    }
  },

  transformMealData: (meal) => {
    if (!meal) return null;

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        const measureText = measure && measure.trim() ? `${measure.trim()} ` : "";
        ingredients.push(`${measureText}${ingredient.trim()}`);
      }
    }

    // ✅ Bug 2 fix — properly filter empty/blank instruction steps
    const instructions = meal.strInstructions
      // ? meal.strInstructions
      //     .split(/\r\n|\r|\n/)
      //     .map(step => step.replace(/^\d+\.\s*/, '').trim())
      //     .filter(step => step.length > 3)
      // : [];
      ? meal.strInstructions
      .split(/\r\n|\r|\n/)
      .map(step => step.replace(/^\d+\.\s*/, '').trim())
      .filter(step => 
        step.length > 10 &&                          // ✅ remove very short lines
        !/^step\s*\d+$/i.test(step) &&               // ✅ remove "step 1", "step 2" etc
        !/^\d+$/.test(step)                          // ✅ remove lines that are just numbers
      )
  : [];

    return {
      id: meal.idMeal,
      title: meal.strMeal,
      description: meal.strInstructions
        ? meal.strInstructions.substring(0, 120) + "..."
        : "Delicious meal from TheMealDB",
      image: meal.strMealThumb,
      cookTime: "30 minutes",
      servings: 4,
      category: meal.strCategory || "Main Course",
      area: meal.strArea,
      ingredients,
      instructions,
      originalData: meal,
    };
  },
};