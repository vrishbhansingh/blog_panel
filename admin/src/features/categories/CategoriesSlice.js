import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCategories, createCategory, deleteCategoryById, updateCategoryById } from '../../api';

// Thunk to fetch all categories
export const getCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    const response = await fetchCategories();
    return response.data;
  }
);

// Thunk to add a new category
export const addCategory = createAsyncThunk(
  'categories/createCategory',
  async (categoryData) => {
    const response = await createCategory(categoryData);
    console.log(response.data)
    return response.data;
  }
);

// ✅ Thunk to delete a category
export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (id) => {
    await deleteCategoryById(id);
    return id;
  }
);

// ✅ Thunk to update a category
export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, updatedData }) => {
    const response = await updateCategoryById(id, updatedData);
    return response.data;
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    status: 'idle',
    addStatus: 'idle', // ✅ Add this
    error: null,
  },
  reducers: {
    // ✅ Add a reducer to reset the addStatus
    resetAddStatus: (state) => {
      state.addStatus = 'idle';
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // ✅ Handle Add Category Status
      .addCase(addCategory.pending, (state) => {
        state.addStatus = 'loading';
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.addStatus = 'success'; // ✅ Set to success
      })
      .addCase(addCategory.rejected, (state) => {
        state.addStatus = 'failed';
      })

      // ✅ Delete Category
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter(cat => cat._id !== action.payload);
      })

      // ✅ Update Category
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.items.findIndex(cat => cat._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { resetAddStatus } = categoriesSlice.actions;
export default categoriesSlice.reducer;
