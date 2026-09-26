import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchProducts, createProduct, deleteProductById, updateProductById } from '../../api';

// GET all products
export const getProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    const response = await fetchProducts();
    return response.data;
  }
);

// ADD new product
export const addProduct = createAsyncThunk(
  'products/createProduct',
  async (productData) => {
    const response = await createProduct(productData);
    return response.data;
  }
);

// DELETE product
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (productId) => {
    await deleteProductById(productId);
    return productId;
  }
);

// UPDATE product
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }) => {
    const response = await updateProductById(id, data);
    return response.data;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    status: 'idle',
     addStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      
      .addCase(addProduct.pending, (state) => {
  state.addStatus = 'loading';
})
.addCase(addProduct.fulfilled, (state, action) => {
  state.items.push(action.payload);
  state.addStatus = 'succeeded';
})
.addCase(addProduct.rejected, (state) => {
  state.addStatus = 'failed';
})

.addCase(updateProduct.pending, (state) => {
  state.updateStatus = 'loading';
})
.addCase(updateProduct.fulfilled, (state, action) => {
  const index = state.items.findIndex(p => p._id === action.payload._id);
  if (index !== -1) {
    state.items[index] = action.payload;
  }
  state.updateStatus = 'succeeded';
})
.addCase(updateProduct.rejected, (state) => {
  state.updateStatus = 'failed';
})

.addCase(deleteProduct.pending, (state) => {
  state.deleteStatus = 'loading';
})
.addCase(deleteProduct.fulfilled, (state, action) => {
  state.items = state.items.filter(p => p._id !== action.payload);
  state.deleteStatus = 'succeeded';
})
.addCase(deleteProduct.rejected, (state) => {
  state.deleteStatus = 'failed';
})

  },
});

export default productsSlice.reducer;
