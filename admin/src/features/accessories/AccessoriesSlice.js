import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  fetchAccessories, 
  createAccessory, 
  deleteAccessoryById, 
  updateAccessoryById 
} from '../../api';


// ✅ Fetch all accessories
export const getAccessories = createAsyncThunk(
  'accessories/fetchAccessories',
  async () => {
    const response = await fetchAccessories();
    return response.data;
  }
);

// ✅ Add new accessory
export const addAccessory = createAsyncThunk(
  'accessories/createAccessory',
  async (accData) => {
    const response = await createAccessory(accData);
    return response.data;
  }
);

// ✅ Delete accessory
export const deleteAccessory = createAsyncThunk(
  'accessories/deleteAccessory',
  async (id) => {
    await deleteAccessoryById(id);
    return id;
  }
);

// ✅ Update accessory
export const updateAccessory = createAsyncThunk(
  'accessories/updateAccessory',
  async ({ id, updatedData }) => {
    const response = await updateAccessoryById(id, updatedData);
    return response.data;
  }
);


const accessoriesSlice = createSlice({
  name: 'accessories',
  initialState: {
    items: [],
    status: 'idle',
    addStatus: 'idle',
    error: null,
  },

  reducers: {
    resetAddStatus: (state) => {
      state.addStatus = 'idle';
    },
  },

  extraReducers(builder) {
    builder

      // Fetch
      .addCase(getAccessories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getAccessories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(getAccessories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // Add
      .addCase(addAccessory.pending, (state) => {
        state.addStatus = 'loading';
      })
      .addCase(addAccessory.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.addStatus = 'success';
      })
      .addCase(addAccessory.rejected, (state) => {
        state.addStatus = 'failed';
      })

      // Delete
      .addCase(deleteAccessory.fulfilled, (state, action) => {
        state.items = state.items.filter((acc) => acc._id !== action.payload);
      })

      // Update
      .addCase(updateAccessory.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (acc) => acc._id === action.payload._id
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { resetAddStatus } = accessoriesSlice.actions;
export default accessoriesSlice.reducer;
