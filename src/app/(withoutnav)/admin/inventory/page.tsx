'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productFormSchema, type ProductFormData } from '@/zodSchemas/productForm'
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { auth } from '@/lib/firebase/config'

interface Product {
  _id: string
  name: string
  description: string
  pricing: {
    basePrice: number
    clothProvidedDiscount: number
    clothType: {
      materials: Array<{
        name: string
        additionalCost: number
        isAvailable: boolean
      }>
    }
  }
  denomination: string
  images: string[]
  showClothsProvided: boolean
  colors: Array<{ color: string; colorCode: string }>
  isActive: boolean
  getDisplayPrice?: () => number
}

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedDenomination, setSelectedDenomination] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Helper function to reset form and state
  const resetFormAndState = () => {
    reset()
    setImagePreview([])
    setImageFiles([])
    setEditingProduct(null)
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      pricing: {
        basePrice: 0,
        clothProvidedDiscount: 0,
        clothType: {
          materials: [{
            name: 'Cotton',
            additionalCost: 0,
            isAvailable: true
          }]
        }
      },
      denomination: '',
      images: [],
      showClothsProvided: true,
      colors: [{ color: '', colorCode: '#000000' }],
      isActive: true
    }
  })

  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
    control,
    name: 'colors'
  })

  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({
    control,
    name: 'pricing.clothType.materials'
  })

  // Fetch products from database
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const result = await response.json()
        // Handle structured API response
        if (result.success && result.data && Array.isArray(result.data.products)) {
          setProducts(result.data.products)
        } else if (Array.isArray(result)) {
          // Fallback for direct array response
          setProducts(result)
        } else {
          console.error('API response structure unexpected:', result)
          setProducts([])
        }
      } else {
        console.error('Failed to fetch products, status:', response.status)
        // Use mock data when API fails (for development)
        
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      // Use mock data when fetch fails (for development)
      
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const filesArray = Array.from(files)
      setImageFiles(prev => [...prev, ...filesArray])
      
      const newPreviews: string[] = []
      filesArray.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string)
            if (newPreviews.length === filesArray.length) {
              setImagePreview(prev => [...prev, ...newPreviews])
            }
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  // Upload images to S3
  const uploadImagesToS3 = async (files: File[], productId: string): Promise<string[]> => {
    setUploadingImages(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('productId', productId)

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to upload image')
        }

        const result = await response.json()
        uploadedUrls.push(result.imageUrl)
      }

      return uploadedUrls
    } finally {
      setUploadingImages(false)
    }
  }

  // Delete image from S3
  const deleteImageFromS3 = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/upload/image', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  // Remove image preview
  const removeImagePreview = (index: number) => {
    const newPreviews = imagePreview.filter((_, i) => i !== index)
    const newFiles = imageFiles.filter((_, i) => i !== index)
    setImagePreview(newPreviews)
    setImageFiles(newFiles)
  }

  // Submit form
  const onSubmit = async (data: ProductFormData) => {
    try {
      console.log('=== FORM SUBMISSION DEBUG ===');
      console.log('Complete form data:', JSON.stringify(data, null, 2));
      console.log('showClothsProvided value:', data.showClothsProvided);
      console.log('showClothsProvided type:', typeof data.showClothsProvided);
      console.log('Is showClothsProvided true?:', data.showClothsProvided === true);
      console.log('Is showClothsProvided false?:', data.showClothsProvided === false);
      console.log('============================');
      setUploadingImages(true)
      let imageUrls: string[] = []

      // Get authentication token
      const user = auth.currentUser
      if (!user) {
        console.error('No authenticated user found')
        return
      }
      const token = await user.getIdToken()

      // If creating new product, create it first to get the ID
      let productId = editingProduct?._id
      if (!productId) {
        const tempProduct = {
          ...data,
          images: [] // Start with empty images
        }
        
        const createResponse = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tempProduct)
        })
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({ message: 'Unknown error' }))
          console.error('Failed to create product:', errorData)
          throw new Error(`Failed to create product: ${errorData.message || errorData.error || 'Unknown error'}`)
        }
        
        const createdProduct = await createResponse.json()
        productId = createdProduct.data._id
      }

      // Upload new images to S3 if any
      if (imageFiles.length > 0 && productId) {
        imageUrls = await uploadImagesToS3(imageFiles, productId)
      }

      // If editing, include existing images
      if (editingProduct) {
        // Delete old images that are no longer in preview
        const existingImages = editingProduct.images || []
        const removedImages = existingImages.filter(img => !imagePreview.includes(img))
        
        for (const imageUrl of removedImages) {
          await deleteImageFromS3(imageUrl)
        }
        
        // Keep existing images that are still in preview
        const keptImages = existingImages.filter(img => imagePreview.includes(img))
        imageUrls = [...keptImages, ...imageUrls]
      }

      // Update product with final image URLs
      const finalData = {
        ...data,
        images: imageUrls
      }

      const method = editingProduct ? 'PUT' : 'PUT' // Always PUT since we created it above for new products
      const url = `/api/products/${productId}`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalData)
      })
      
      if (response.ok) {
        setIsDialogOpen(false)
        resetFormAndState()
        fetchProducts()
      } else {
        console.error('Failed to save product')
      }
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setUploadingImages(false)
    }
  }
  
  // Edit product
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    reset({
      name: product.name,
      description: product.description,
      pricing: product.pricing || {
        basePrice: 0,
        clothProvidedDiscount: 0,
        clothType: {
          materials: [{
            name: 'Cotton',
            additionalCost: 0,
            isAvailable: true
          }]
        }
      },
      denomination: product.denomination,
      images: [],
      showClothsProvided: product.showClothsProvided ?? true,
      colors: product.colors.length > 0 ? product.colors : [{ color: '', colorCode: '#000000' }],
      isActive: product.isActive
    })
    setImagePreview(product.images || [])
    setImageFiles([]) // Clear any pending files when editing
    setIsDialogOpen(true)
  }
  
  // Delete product
  const handleDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // Get the current user's ID token for authentication
        const user = auth.currentUser
        if (!user) {
          console.error('No authenticated user found')
          return
        }

        const token = await user.getIdToken()
        
        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          fetchProducts()
          console.log('Product deleted successfully')
        } else {
          const errorData = await response.json()
          console.error('Failed to delete product:', errorData.error || 'Unknown error')
        }
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }
  
  // Handle Add New Item button click
  const handleAddNewItem = () => {
    setEditingProduct(null)
    reset({
      name: '',
      description: '',
      pricing: {
        basePrice: 0,
        clothProvidedDiscount: 0,
        clothType: {
          materials: [{
            name: 'Cotton',
            additionalCost: 0,
            isAvailable: true
          }]
        }
      },
      denomination: '',
      images: [],
      colors: [{ color: '', colorCode: '#000000' }],
      isActive: true
    })
    setImagePreview([])
    setIsDialogOpen(true)
  }
  
  // Handle dialog open/close properly
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Only reset when closing
      resetFormAndState()
    }
    setIsDialogOpen(open)
  }
  
  // Reset form when dialog closes
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetFormAndState()
  }

  // Filter products by denomination
  const filteredProducts = selectedDenomination === 'all' 
    ? products 
    : Array.isArray(products) ? products.filter(product => product.denomination === selectedDenomination) : []

  // Get unique denominations
  const denominations = Array.isArray(products) ? Array.from(new Set(products.map(p => p.denomination))) : []



  return (
    <div className="space-y-4 lg:space-y-6 font-poppins p-4 lg:p-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 text-xs lg:text-sm mt-1">Manage your dress catalog</p>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <Label htmlFor="denomination" className='text-sm lg:text-base'>Denomination:</Label>
            <Select value={selectedDenomination} onValueChange={setSelectedDenomination}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Denominations</SelectItem>
                {denominations.map(denomination => (
                  <SelectItem key={denomination} value={denomination}>
                    {denomination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            className="bg-black hover:bg-gray-800 text-white text-sm lg:text-base"
            onClick={handleAddNewItem}
          >
            Add New Item
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="max-w-xs sm:max-w-md lg:max-w-4xl mx-4 lg:mx-auto max-h-[90vh] overflow-y-auto font-poppins">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Update product information and details.' : 'Create a new product listing with all required information.'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit, (errors) => {
                console.log('=== FORM VALIDATION ERRORS ===');
                console.log('Validation errors:', errors);
                console.log('===============================');
              })} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input {...register('name')} placeholder="Traditional Chasuble" />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="basePrice">Base Price (₹)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      {...register('pricing.basePrice', { valueAsNumber: true })} 
                      placeholder="450" 
                    />
                    {errors.pricing?.basePrice && <p className="text-red-500 text-sm">{errors.pricing.basePrice.message}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="clothProvidedDiscount">Cloth Provided Discount (₹)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      {...register('pricing.clothProvidedDiscount', { valueAsNumber: true })} 
                      placeholder="50" 
                    />
                    {errors.pricing?.clothProvidedDiscount && <p className="text-red-500 text-sm">{errors.pricing.clothProvidedDiscount.message}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea {...register('description')} placeholder="Traditional chasuble with long back, embroidered..." />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>

                {/* Cloth Type Section */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Materials</Label>
                  
                  <div className="border rounded-lg p-4 space-y-4">
                      {/* Materials */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">Materials</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendMaterial({
                              name: '',
                              additionalCost: 0,
                              isAvailable: true
                            })}
                          >
                            Add Material
                          </Button>
                        </div>
                        
                        {materialFields.map((field, materialIndex) => (
                          <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                            <div>
                              <Label htmlFor={`material.${materialIndex}.name`}>Material Name</Label>
                              <Input
                                {...register(`pricing.clothType.materials.${materialIndex}.name` as const)}
                                placeholder="Cotton"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`material.${materialIndex}.additionalCost`}>Additional Cost (₹)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                {...register(`pricing.clothType.materials.${materialIndex}.additionalCost` as const, { valueAsNumber: true })}
                                placeholder="25"
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                {...register(`pricing.clothType.materials.${materialIndex}.isAvailable` as const)}
                                className="rounded"
                              />
                              <Label className="text-sm">Available</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeMaterial(materialIndex)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                <div>
                  <Label htmlFor="denomination">Denomination</Label>
                  <Controller
                    name="denomination"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select denomination" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Orthodox & Jacobite">Orthodox & Jacobite</SelectItem>
                          <SelectItem value="Mar Thoma">Mar Thoma</SelectItem>
                          <SelectItem value="CSI">CSI</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.denomination && <p className="text-red-500 text-sm">{errors.denomination.message}</p>}
                </div>

                {/* Image Upload */}
                <div>
                  <Label>Product Images</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Label htmlFor="images" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Upload images
                          </span>
                          <Input
                            id="images"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Image Previews */}
                  {imagePreview.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={`${preview}`}
                            alt={`Preview ${index}`}
                            width={100}
                            height={100}
                            className="rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImagePreview(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Colors */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Colors</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendColor({ color: '', colorCode: '#000000' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Color
                    </Button>
                  </div>
                  
                  {colorFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2 mt-2">
                      <Input
                        {...register(`colors.${index}.color`)}
                        placeholder="Color name"
                        className="flex-1"
                      />
                      <Input
                        type="color"
                        {...register(`colors.${index}.colorCode`)}
                        className="w-16 h-10"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeColor(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Toggle Options */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Show &quot;Cloths Provided&quot; Option
                    </Label>
                    <Controller
                      name="showClothsProvided"
                      control={control}
                      render={({ field }) => (
                        <div className="flex space-x-6">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="showClothsProvided-yes"
                              name="showClothsProvided"
                              value="true"
                              checked={field.value === true}
                              onChange={() => field.onChange(true)}
                              className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                            />
                            <Label htmlFor="showClothsProvided-yes" className="text-sm">
                              Yes - Allow customers to choose
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="showClothsProvided-no"
                              name="showClothsProvided"
                              value="false"
                              checked={field.value === false}
                              onChange={() => field.onChange(false)}
                              className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                            />
                            <Label htmlFor="showClothsProvided-no" className="text-sm">
                              No - We provide the cloth
                            </Label>
                          </div>
                        </div>
                      )}
                    />
                    <p className="text-xs text-gray-500">
                      Choose &quot;Yes&quot; to let customers provide their own cloth for a discount, or &quot;No&quot; if you always provide the material.
                    </p>
                    {errors.showClothsProvided && <p className="text-red-500 text-sm">{errors.showClothsProvided.message}</p>}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={Boolean(field.value)}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                      )}
                    />
                    <Label htmlFor="isActive" className="text-sm font-medium">
                      Active Product
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    Only active products will be visible to customers on the website.
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-black hover:bg-gray-800 text-white" disabled={uploadingImages}>
                    {uploadingImages ? 'Uploading...' : (editingProduct ? 'Update Product' : 'Add Product')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-8 lg:p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm lg:text-base">Loading products...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredProducts.map((product) => (
          <Card key={product._id} className="overflow-hidden">
            <div className="aspect-square relative bg-gray-100">
              {product.images[0] ? (
                <Image
                  src={`${product.images[0]}`}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm lg:text-base">
                  No Image
                </div>
              )}
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            
            <div className="p-3 lg:p-4">
              <h3 className="font-semibold text-base lg:text-lg mb-1">{product.name}</h3>
              <p className="text-xs lg:text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
              <p className="font-bold text-base lg:text-lg mb-3">₹{product.getDisplayPrice?.() || product.pricing?.basePrice || 0}</p>
              
              <div className="flex flex-col lg:flex-row gap-2 lg:gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs lg:text-sm"
                  onClick={() => handleEdit(product)}
                >
                  <Edit className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-red-600 hover:text-red-700 text-xs lg:text-sm"
                  onClick={() => handleDelete(product._id)}
                >
                  <Trash2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </Card>
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <Card className="p-8 lg:p-12 text-center">
          <p className="text-gray-600 text-sm lg:text-base">No products found for the selected denomination.</p>
        </Card>
      )}
    </div>
  )
}

export default InventoryPage