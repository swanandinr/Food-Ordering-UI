package com.crave.service;

import com.crave.dto.OrderRequest;
import com.crave.entity.Food;
import com.crave.entity.Order;
import com.crave.entity.OrderItem;
import com.crave.repository.FoodRepository;
import com.crave.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service layer for order-related business logic.
 * Validates food IDs and quantities, calculates totals server-side.
 */
@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final FoodRepository foodRepository;

    public OrderService(OrderRepository orderRepository, FoodRepository foodRepository) {
        this.orderRepository = orderRepository;
        this.foodRepository = foodRepository;
    }

    /**
     * Create a new order from the request.
     * - Validates that items list is not empty.
     * - Validates each food ID exists in the database.
     * - Validates each quantity is at least 1.
     * - Calculates totals using database prices (never trusts frontend).
     */
    public Order createOrder(OrderRequest request) {
        List<OrderRequest.OrderItemRequest> requestItems = request.getItems();

        if (requestItems == null || requestItems.isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item.");
        }

        Order order = new Order();
        int totalAmount = 0;

        for (OrderRequest.OrderItemRequest item : requestItems) {
            // Validate quantity
            if (item.getQuantity() < 1) {
                throw new IllegalArgumentException(
                    "Quantity must be at least 1 for food ID " + item.getFoodId() + "."
                );
            }

            // Validate food exists
            Food food = foodRepository.findById(item.getFoodId())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Food item with ID " + item.getFoodId() + " not found."
                ));

            // Create order item with the current database price
            OrderItem orderItem = new OrderItem(
                food.getId(),
                food.getName(),
                food.getPrice(),
                item.getQuantity()
            );

            order.addItem(orderItem);
            totalAmount += orderItem.getSubtotal();
        }

        order.setTotalAmount(totalAmount);
        if (request.getCustomerName() != null && !request.getCustomerName().trim().isEmpty()) {
            order.setCustomerName(request.getCustomerName().trim());
        }
        if (request.getDeliveryAddress() != null && !request.getDeliveryAddress().trim().isEmpty()) {
            order.setDeliveryAddress(request.getDeliveryAddress().trim());
        }
        return orderRepository.save(order);
    }

    /**
     * Get all orders, sorted by most recent first.
     */
    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        // Sort by createdAt descending (newest first)
        orders.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return orders;
    }

    /**
     * Get a single order by ID.
     */
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }
}
