import { configureStore } from '@reduxjs/toolkit';
import categoriesReducer from '../features/categories/CategoriesSlice';
import productsReducer from '../features/products/ProductsSlice';
import accessoriesReducer from '../features/accessories/AccessoriesSlice';

export const store = configureStore({
  reducer: {
    categories: categoriesReducer,
    products: productsReducer,
     accessories: accessoriesReducer,  // <-- MUST
  },
});
