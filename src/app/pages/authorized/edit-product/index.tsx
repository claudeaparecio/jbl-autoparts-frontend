import { NavLink, useNavigate } from "react-router";
import { useGetSKUsQuery } from "store/apis/skusApi";
import ImagePicker from "../shared/product-components/image-picker";
import GeneralInformation from "../shared/product-components/general-information";
import InventoryDetails from "../shared/product-components/inventory-details";
import { ProductDetails } from "types/inventory";
import { defaultProduct } from "constants/default-values";
import { Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useCreateProductMutation, useDeleteProductMutation, useEditProductMutation, useLazyGetProductByIdQuery } from "store/apis/productsApi";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import { clearData } from "store/slices/editProductSlice";
import ProductVariants from "./components/product-variants";
import { useEffect, useState } from "react";
import AddProductVariantModal from "./components/add-product-variant.modal";
import LoadingComponent from "app/pages/shared/loading.component";
import { getImageUrl } from "helpers";
import EditProductVariantModal from "./components/edit-product-variant.modal";
import DeleteProductVariantModal from "./components/delete-product-variant.modal";
import { setIsAppLoading } from "store/slices/appSlice";
import * as Sentry from '@sentry/react';
const apiURL = process.env.REACT_APP_API_BASE_URL;

const validationSchema = Yup.object({
  name: Yup.string().required("Product name is required"),
  brand: Yup.string().when("hasParentId", {
    is: false,
    then: (schema) => schema.required("Brand name is required"),
    otherwise: (schema) => schema,
  }),
  description: Yup.string().when("hasParentId", {
    is: false,
    then: (schema) => schema.required("Product description is required"),
    otherwise: (schema) => schema,
  }),
  hasParentId: Yup.boolean(),
  sku: Yup.string().when("hasParentId", {
    is: false,
    then: (schema) => schema.required("Product SKU is required"),
    otherwise: (schema) => schema,
  }),
  price: Yup.number()
    .positive("Price must be positive")
    .required("Price is required"),
  quantityRemaining: Yup.number()
    .min(1, "Cannot be zero")
    .required("Remaining quantity required"),
  quantitySold: Yup.number()
    .min(0, "Cannot be negative")
    .required("Sold quantity required"),
  quantityThreshold: Yup.number()
    .min(1, "Cannot be zero"),
  partNumber: Yup.string().when("hasParentId", {
    is: false,
    then: (schema) => schema.required("Part number is required"),
    otherwise: (schema) => schema,
  }),
  tags: Yup.array().min(1, "At least one tag required"),
});

const EditProduct = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: skusData } = useGetSKUsQuery();
  const state = useSelector((state: RootState) => state);
  const editProductId = state.editProduct._id;
  const isMobile = state.app.isMobile;
  const role = state.user.role;

  const [editProduct] = useEditProductMutation();
  const [getProductById] = useLazyGetProductByIdQuery();
  const [createProduct] = useCreateProductMutation();
  const [deleteProduct, deleteResponse] = useDeleteProductMutation();

  const [addVariantModalOpen, setAddVariantModalOpen] = useState(false);
  const [editVariantModalOpen, setEditVariantModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [productVariants, setProductVariants] = useState<ProductDetails[]>([]);
  const [product, setProduct] = useState<ProductDetails | undefined>();
  const [productToEdit, setProductToEdit] = useState<ProductDetails | undefined>();
  const [productToDelete, setProductToDelete] = useState<ProductDetails | undefined>();

  const skus = skusData?.data.skus;
  const isVariant = product?.parentId;

  const goBack = () => navigate(-1)

  const fetchProduct = async (productId?: string) => {
    setIsLoading(true);
    if (!productId) return;
    try {
      const response = await getProductById({ productId }).unwrap();
      const product = response.data.product;
      setProductVariants(product.variants || []);
      setProduct({
        ...product,
        hasParentId: !!product.parentId,
        images: product.images.map((url: any) => ({ url, file: null }))
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error("Failed to fetch product details.");
      setIsLoading(false);
      Sentry.captureException(error);
    }
  };

  useEffect(() => {
    fetchProduct(state.editProduct._id);
  }, [state.editProduct._id])

  const _clearData = () => {
    dispatch(clearData());
  };

  const toggleAddVariantModalOpen = () => {
    setAddVariantModalOpen(!addVariantModalOpen);
  };

  const toggleEditVariantModalOpen = () => {
    setEditVariantModalOpen(!editVariantModalOpen);
  };

  const onEditProductVariant = async (
    values: ProductDetails,
    helpers: FormikHelpers<ProductDetails>
  ) => {
    try {
      dispatch(setIsAppLoading(true));
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("partNumber", values.partNumber ?? "");
      formData.append("brand", values.brand ?? "");

      if (values.price) {
        formData.append("price", values.price.toString());
      }
      formData.append("sku", values.sku ?? "");
      formData.append("quantityRemaining", values.quantityRemaining.toString());

      values.tags.forEach((tag) => {
        formData.append("tags[]", tag);
      });
      formData.append("description", values.description ?? "");
      formData.append("parentId", editProductId ?? "");

      const existingImageUrls: string[] = [];

      values.images.forEach((imageFile: any) => {
        if (imageFile?.file) {
          formData.append("files", imageFile.file);
        } else if (imageFile?.url) {
          existingImageUrls.push(imageFile.url);
        }
      });

      formData.append("existingImages", JSON.stringify(existingImageUrls));

      const editedProduct = await editProduct({ formData, productId: values?._id ?? "" }).unwrap();
      dispatch(setIsAppLoading(false));
      setProductVariants((variants) => variants.map((variant) => variant._id === editedProduct.data._id ? editedProduct.data : variant));

      toast.success("Variant Edited!");
      helpers.resetForm();
      toggleEditVariantModalOpen();
    } catch (err) {
      console.error("Product variant update failed:", err);
      toast.error("Update variant product failed.");
      dispatch(setIsAppLoading(false));
      Sentry.captureException(err);
    }
  }

  const onCreateProductVariant = async (
    values: ProductDetails,
    helpers: FormikHelpers<ProductDetails>
  ) => {
    try {
      dispatch(setIsAppLoading(true));
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("partNumber", values.partNumber ?? "");
      formData.append("brand", values.brand ?? "");
      if (values.price) {
        formData.append("price", values.price.toString());
      }
      formData.append("sku", values.sku ?? "");
      formData.append("quantityRemaining", values.quantityRemaining.toString());
      values.tags.forEach((tag) => {
        formData.append("tags[]", tag);
      });
      formData.append("description", values.description ?? "");
      formData.append("parentId", editProductId ?? "");

      const existingImageUrls: string[] = [];

      values.images.forEach((imageFile: any) => {
        if (imageFile?.file) {
          formData.append("files", imageFile.file);
        } else if (imageFile?.url) {
          existingImageUrls.push(imageFile.url);
        }
      });

      formData.append("existingImages", JSON.stringify(existingImageUrls));

      const response = await createProduct(formData).unwrap();
      setProductVariants((prev) => [
        ...prev,
        response.data
      ]);
      dispatch(setIsAppLoading(false));

      toast.success("Variant Created!");
      helpers.resetForm();
      toggleAddVariantModalOpen();
    } catch (err) {
      console.error("Product updated failed:", err);
      toast.error("Update product failed.");
      dispatch(setIsAppLoading(false));
      Sentry.captureException(err);
    }
  }

  const onClickDeleteVariant = (variant?: ProductDetails) => {
    setProductToDelete(variant);;
  }

  const resetDeleteProduct = () => {
    setProductToDelete(undefined);
  };

  const deleteProductVariant = async () => {
    await deleteProduct(productToDelete?._id ?? "");
    setProductVariants((variants) => variants.filter((variant) => variant._id !== productToDelete?._id));
    resetDeleteProduct();
    toast.success("Delete variant success");
  };

  const onClickEditVariant = (variant: ProductDetails) => {
    if (!variant) return;

    setProductToEdit({
      ...variant,
      images: variant.images.map((url: any) => ({ url, file: null }))
    })
    toggleEditVariantModalOpen();
  }

  const onSubmit = async (
    values: ProductDetails,
    helpers: FormikHelpers<ProductDetails>
  ) => {
    try {
      dispatch(setIsAppLoading(true));
      const formData = new FormData();

      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("brand", values.brand);
      formData.append("sku", values.sku);
      if (values.price) {
        formData.append("price", values.price.toString());
      }
      formData.append("quantityRemaining", values.quantityRemaining.toString());
      formData.append("quantitySold", values.quantitySold.toString());
      formData.append("partNumber", values.partNumber);

      values.tags.forEach((tag) => {
        formData.append("tags[]", tag);
      });

      const existingImageUrls: string[] = [];

      values.images.forEach((imageFile: any) => {
        if (imageFile?.file) {
          formData.append("files", imageFile.file);
        } else if (imageFile?.url) {
          existingImageUrls.push(imageFile.url);
        }
      });

      formData.append("existingImages", JSON.stringify(existingImageUrls));

      await editProduct({ formData, productId: editProductId ?? "" }).unwrap();
      dispatch(setIsAppLoading(false));
      toast.success("Update success!");
      helpers.resetForm();
      _clearData();
      navigate(-1);
    } catch (err) {
      console.error("Product updated failed:", err);
      Sentry.captureException(err);
      toast.error("Update product failed.");
      dispatch(setIsAppLoading(false));
    }
  };

  if (isLoading && !product) return <LoadingComponent />;

  if (!product?._id) return null;

  return (
    <Formik
      initialValues={product ?? defaultProduct}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnChange={true}
      validateOnBlur={false}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        setFieldValue,
        handleSubmit,
      }) => {
        return (
          <div className="flex flex-col p-5 py-4 max-w-screen">
            <p className="text-primary font-semibold text-2xl mt-2">
              Inventory
            </p>
            <div className="flex flex-row my-[12px] justify-between">
              <div className="flex flex-row items-center text-2xl font-medium text-primary">
                <button onClick={goBack} className="py-2">
                  <img
                    src="/images/arrow-left-long.svg"
                    alt=""
                    className="h-[32px] w-[32px] mr-3"
                  />
                </button>
                Edit Product {isVariant ? "Variant" : ""}
              </div>
              <button
                type="button"
                onClick={handleSubmit as any}
                className="px-4 py-2 rounded-lg bg-primary text-white font-medium"
              >
                Save
              </button>
            </div>

            <div className="flex min-lg-custom:space-x-4 mt-4 flex-col min-lg-custom:flex-row min-lg-custom:justify-center">
              <div className="w-8/12 max-lg-custom:w-full flex flex-col justify-center items-center space-y-4">
                {isMobile && (
                  <div className="w-full flex flex-col shadow-lg border bg-white rounded-lg p-4">
                    <ImagePicker
                      isMobile={isMobile}
                      images={values.images}
                      setImages={(imgs: File[]) =>
                        setFieldValue("images", imgs)
                      }
                    />
                  </div>
                )}
                <GeneralInformation
                  fields={values}
                  handleSelectedSKU={(selected: string) =>
                    setFieldValue("sku", selected)
                  }
                  setField={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(e)
                  }
                  skus={skus}
                  errors={errors}
                  handleBlur={handleBlur}
                  touched={touched}
                />
                {!isVariant && (
                  <ProductVariants
                    toggleAddVariantModalOpen={toggleAddVariantModalOpen}
                    productVariants={productVariants}
                    onClickDeleteVariant={onClickDeleteVariant}
                    onClickEditVariant={onClickEditVariant}
                  />
                )}
                <InventoryDetails
                  touched={touched}
                  errors={errors}
                  fields={values}
                  setField={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(e)
                  }
                  setTags={(tags: string[]) => setFieldValue("tags", tags)}
                />
              </div>
              {!isMobile && (
                <div className="w-4/12 flex flex-col shadow-lg border bg-white rounded-lg p-4">
                  <ImagePicker
                    images={values.images}
                    setImages={(imgs: File[]) => setFieldValue("images", imgs)}
                  />
                </div>
              )}
            </div>
            <AddProductVariantModal
              isOpen={addVariantModalOpen}
              toggleModal={toggleAddVariantModalOpen}
              onSubmit={onCreateProductVariant}
            />
            <EditProductVariantModal
              isOpen={editVariantModalOpen}
              toggleModal={toggleEditVariantModalOpen}
              product={productToEdit}
              onSubmit={onEditProductVariant}
            />
            <DeleteProductVariantModal
              isOpen={!!productToDelete?._id}
              onClose={resetDeleteProduct}
              productToDelete={productToDelete}
              onSubmit={deleteProductVariant}
              loading={deleteResponse?.isLoading}
            />
          </div>
        );
      }}
    </Formik>
  );
};

export default EditProduct;
