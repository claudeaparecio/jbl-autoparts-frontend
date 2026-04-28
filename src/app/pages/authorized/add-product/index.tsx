import { NavLink, useNavigate } from "react-router";
import { useGetSKUsQuery } from "store/apis/skusApi";
import ImagePicker from "../shared/product-components/image-picker";
import GeneralInformation from "../shared/product-components/general-information";
import InventoryDetails from "../shared/product-components/inventory-details";
import { ProductDetails } from "types/inventory";
import { defaultProduct } from "constants/default-values";
import { Formik, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useCreateProductMutation } from "store/apis/productsApi";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/store";
import { clearData } from "store/slices/addProductSlice";
import { setIsAppLoading } from "store/slices/appSlice";
import * as Sentry from '@sentry/react';

const apiURL = process.env.REACT_APP_API_BASE_URL;

const validationSchema = Yup.object({
  name: Yup.string().required("Product name is required"),
  brand: Yup.string().required("Brand name is required"),
  description: Yup.string().required("Product description is required"),
  sku: Yup.string().required("Product SKU is required"),
  price: Yup.number()
    .positive("Price must be positive")
    .required("Price is required"),
  quantityRemaining: Yup.number()
    .min(1, "Cannot be zero")
    .required("Remaining quantity required"),
  quantitySold: Yup.number()
    .min(0, "Cannot be negative")
    .required("Sold quantity required"),
  partNumber: Yup.string().required("Part number is required"),
  tags: Yup.array().min(1, "At least one tag required"),
  quantityThreshold: Yup.number().min(1, "Cannot be zero"),
});

const AddProduct = () => {
  const dispatch = useDispatch();

  const { data: skusData } = useGetSKUsQuery();
  const state = useSelector((state: RootState) => state);

  const role = state.user.role;
  const app = state.app;
  const addProduct = state.addProduct.product;
  const isMobile = app.isMobile;
  const isDuplicate = addProduct?._id;
  const navigate = useNavigate();
  const [
    createProduct,
    { isLoading, isSuccess, isError },
  ] = useCreateProductMutation();

  const skus = skusData?.data.skus;

  // const openAddSkuModal = () => {
  //   dispatch(setIsAddSKUsModalVisible(true));
  // };

  const onSubmit = async (
    values: ProductDetails,
    helpers: FormikHelpers<ProductDetails>
  ) => {
    try {
      dispatch(setIsAppLoading(true));
      const formData = new FormData();

      // Append fields
      formData.append("name", values.name);
      formData.append("brand", values.brand);
      formData.append("description", values.description);
      formData.append("sku", values.sku);
      if (values.price) {
        formData.append("price", values.price.toString());
      }
      formData.append("quantityRemaining", values.quantityRemaining.toString());
      formData.append("quantitySold", values.quantitySold.toString());
      formData.append("partNumber", values.partNumber);
      formData.append(
        "quantityThreshold",
        (values.quantityThreshold ?? 1)?.toString()
      );

      values.tags.forEach((tag) => {
        formData.append("tags[]", tag);
      });

      const existingImageUrls: string[] = [];

      values.images.forEach((imageFile: any) => {
        if (imageFile?.file) {
          formData.append("files", imageFile.file);
        } else if (imageFile?.url) {
          existingImageUrls.push(imageFile.url.slice(apiURL?.length || ""));
        }
      });

      formData.append("existingImages", JSON.stringify(existingImageUrls));

      await createProduct(formData).unwrap();
      dispatch(setIsAppLoading(false));
      helpers.resetForm();
      toast.success("Product created successfully.");
      navigate(-1);
    } catch (err) {
      Sentry.captureException(err);
      console.error("Product creation failed:", err);
      toast.error("Create product failed.");
      dispatch(setIsAppLoading(false));
    }
  };

  const _clearData = () => {
    dispatch(clearData());
  };

  return (
    <Formik
      initialValues={isDuplicate ? addProduct : defaultProduct}
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
                <NavLink
                  to={`/${role}/inventory`}
                  onClick={_clearData}
                  className="py-2"
                >
                  <img
                    src="/images/arrow-left-long.svg"
                    alt=""
                    className="h-[32px] w-[32px] mr-3"
                  />
                </NavLink>
                Add Product
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
          </div>
        );
      }}
    </Formik>
  );
};

export default AddProduct;
