package com.crave.service;

import com.crave.entity.Food;
import com.crave.repository.FoodRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for food-related business logic.
 */
@Service
public class FoodService {

    private final FoodRepository foodRepository;

    public FoodService(FoodRepository foodRepository) {
        this.foodRepository = foodRepository;
    }

    /**
     * Get all food items, optionally filtered by category or search query.
     */
    public List<Food> getFoods(String category, String search) {
        // If a search query is provided, use it (takes priority)
        if (search != null && !search.trim().isEmpty()) {
            return foodRepository.searchFoods(search.trim());
        }

        // If a category is provided, filter by it
        if (category != null && !category.trim().isEmpty()) {
            return foodRepository.findByCategoryIgnoreCase(category.trim());
        }

        // Otherwise, return all foods
        return foodRepository.findAll();
    }

    /**
     * Get a single food item by ID.
     */
    public Optional<Food> getFoodById(Long id) {
        return foodRepository.findById(id);
    }
}
