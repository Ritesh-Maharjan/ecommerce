import React, { useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "../component/Alert";
import Loading from "../component/Loading";
import Popup from "../component/Popup";
import Star from "../component/Star";
import { addToCart } from "../redux/slicer/cartSlice";
import {
  getAlert,
  getPopup,
  toggleAlert,
  togglePopup,
} from "../redux/slicer/popupSlice";
import { getToken, getUser } from "../redux/slicer/userSlice";
import {
  deleteProduct,
  deleteReview,
  getProduct,
  getProductReview,
  submitReview,
} from "../utils/productApi";

const ProductDetail = () => {
  const dispatch = useDispatch();
  const param = useParams();
  const navigate = useNavigate();
  const { id } = param;
  const user = JSON.parse(useSelector(getUser));
  const popup = useSelector(getPopup);
  const alert = useSelector(getAlert);
  const token = useSelector(getToken);
  const [product, setProduct] = useState();
  const [productReview, setProductReview] = useState();
  const [errors, setErrors] = useState();
  const [mainImage, setMainImage] = useState();
  const [quantity, setQuantity] = useState(1);
  const [review, setReview] = useState({
    productId: id,
    rating: 1,
    comments: "",
  });
  const [reviewDependency, setReviewDependency] = useState();
  const [loadingProduct, setLoadingProduct] = useState();
  const [loadingReview, setLoadingReview] = useState();

  useEffect(() => {
    const getProductApi = async () => {
      setLoadingProduct(true);
      const resData = await getProduct(id);
      setLoadingProduct(false);
      if (resData?.data?.success) {
        setProduct(resData.data.product);
        setMainImage(resData.data.product.images[0]?.url);
      } else {
        setErrors(resData.response.data.message);
      }
    };

    const getProductReviewAPi = async () => {
      const resData = await getProductReview(id);
      if (resData?.data?.success) {
        setProductReview(resData.data.reviews);
      }
    };

    getProductApi();
    getProductReviewAPi();
  }, [id, reviewDependency]);

  const changeValue = (status) => {
    if (status === "decrement" && quantity > 0) {
      setQuantity((prevState) => (prevState = prevState - 1));
    }
    if (status === "increment") {
      setQuantity((prevState) => {
        return (prevState = prevState + 1);
      });
    }
  };

  // Add to cart
  const addCart = () => {
    const data = {
      product: product._id,
      name: product.name,
      quantity,
      image: product.images[0].url,
      price: product.price,
    };
    dispatch(addToCart(data));
    dispatch(toggleAlert(true));
    setTimeout(() => dispatch(toggleAlert(false)), 2000);
  };

  //   Changing review in temporary state to send to backend
  const changeReview = (e) => {
    const { name, value } = e.target;

    setReview((prevState) => {
      return {
        ...prevState,
        [name]: value,
      };
    });
  };

  //   Submit review in the database
  const submitReviewApi = async (e) => {
    e.preventDefault();
    setLoadingReview(true);
    const resData = await submitReview(token, review);
    setLoadingReview(false);
    if (resData?.data?.success) {
      setReview({
        productId: id,
        rating: 1,
        comments: "",
      });
      //   to call the useEffect api and get the updated review
      setReviewDependency((prevState) => !prevState);
    }
  };

  // Delete the product
  const deleteProductApi = async () => {
    const resData = await deleteProduct(id, token);
    if (resData.data.success) {
      navigate("/");
      dispatch(togglePopup());
    }
  };

  const deleteReviewApi = async () => {
    const resData = await deleteReview(id, token);
    if (resData.data.success) {
      setReviewDependency(!reviewDependency)
    }
  };

  return (
    <main className="min-h-[90vh] py-4">
      {loadingProduct ? (
        <Loading />
      ) : (
        <>
          {product &&
            (popup ? (
              <Popup
                text="Are you sure you want to delete this product??"
                actionFunc={deleteProductApi}
              />
            ) : (
              <>
                <section className="flex flex-col gap-4 sm:flex-row m-auto w-[90vw]">
                  {errors && (
                    <p className="text-center text-red-400">{errors}</p>
                  )}
                  {/* Images */}
                  <div className="flex flex-col items-center gap-4 flex-1">
                    {product?.images.length > 0 ? (
                      <>
                        <div>
                          <img
                            src={mainImage}
                            alt="main product"
                            className="h-[400px] sm:h-[500px] object-cover"
                          />
                        </div>
                        <div className="flex gap-2 overflow-hidden">
                          {product.images.map((el) => {
                            return (
                              <img
                                key={el.public_id}
                                src={el.url}
                                alt="different view"
                                className="h-[50px] w-[70px] sm:w-[100px] sm:h-[100px] object-cover object-top"
                                onClick={(e) => setMainImage(el.url)}
                              />
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <img
                        className="w-[450px] h-[250px]"
                        src={
                          "https://imgs.search.brave.com/dFhbkHCOtMiyZ1lYDAcOXVSNCIyhL4tnvqeFy94jYhU/rs:fit:433:225:1/g:ce/aHR0cHM6Ly90c2Uz/Lm1tLmJpbmcubmV0/L3RoP2lkPU9JUC5X/bkg2U0s0WlpjQVBs/M3hhNjBOclZ3QUFB/QSZwaWQ9QXBp"
                        }
                        alt="Images not found"
                      />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col items-center gap-3 sm:items-start">
                    <h1 className="font-bold tracking-wider text-xl sm:text-2xl md:text-3xl">
                      {product.name}
                    </h1>

                    <p>{product.description}</p>

                    {/* Star ratings */}
                    <div className="flex items-center gap-2 mt-2">
                      <Star ratings={product.ratings} />

                      <span className="text-lg lg:text-xl">{`${product.numOfReviews} reviews`}</span>
                    </div>

                    <h2 className="md:text-xl">${`${product.price}`} CAD</h2>

                    {/* Quantity */}
                    {user?.role !== "admin" && (
                      <div className="flex gap-2">
                        <span onClick={(e) => changeValue("increment")}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"
                            />
                          </svg>
                        </span>
                        <span className="text-black w-12 text-center border-2 bg-white">
                          {quantity}
                        </span>
                        <span onClick={(e) => changeValue("decrement")}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 12h-15"
                            />
                          </svg>
                        </span>
                      </div>
                    )}

                    {user?.role === "admin" ? (
                      <div className="flex gap-2">
                        <Link
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          type="submit"
                          to={`../../update/${product._id}`}
                        >
                          Update
                        </Link>
                        <button
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          type="submit"
                          onClick={() => dispatch(togglePopup())}
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="submit"
                        onClick={addCart}
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </section>

                <section className="flex flex-col gap-4 m-auto w-[90vw] mt-10">
                  {/* Post review */}
                  {user?.role !== "admin" && (
                    <div className="flex-1">
                      {user ? (
                        <div className="flex flex-col items-center">
                          <h1 className="font-bold text-xl">Leave a review</h1>

                          <form
                            className="bg-white text-gray-700 font-semibold text-lg shadow-md rounded px-2 md:px-6 pt-6 pb-8 mb-4 flex flex-col gap-4"
                            onSubmit={submitReviewApi}
                          >
                            <div className="flex gap-4">
                              <label className="w-20">Rating:</label>
                              <select
                                className="w-32 text-gray-700 bg-slate-200 rounded-md p-1"
                                name="rating"
                                onChange={(e) => changeReview(e)}
                                value={review.rating}
                              >
                                <option
                                  className="rounded-md bg-slate-200"
                                  value={1}
                                >
                                  1
                                </option>
                                <option
                                  className="rounded-md bg-slate-200"
                                  value={2}
                                >
                                  2
                                </option>
                                <option
                                  className="rounded-md bg-slate-200"
                                  value={3}
                                >
                                  3
                                </option>
                                <option
                                  className="rounded-md bg-slate-200"
                                  value={4}
                                >
                                  4
                                </option>
                                <option
                                  className="rounded-md bg-slate-200"
                                  value={5}
                                >
                                  5
                                </option>
                              </select>
                            </div>
                            <div className="flex item-center gap-4">
                              <label className="w-20">Comment:</label>
                              <textarea
                                placeholder="Leave your review"
                                className="text-black w-[200px] h-[80px] border-2"
                                name="comments"
                                value={review.comments}
                                onChange={(e) => changeReview(e)}
                                required
                              />
                            </div>

                            <button
                              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                              type="submit"
                              onSubmit={(e) => submitReviewApi(e)}
                              disabled={loadingReview}
                            >
                              {loadingReview ? "Submitting" : "Submit"}
                            </button>
                          </form>
                        </div>
                      ) : (
                        <h1 className="text-center">
                          Please log in to leave a review
                        </h1>
                      )}
                    </div>
                  )}

                  {/* Reviews  */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <h1 className="text-xl md:text-3xl mb-2">Reviews</h1>
                    {productReview?.length > 0 ? (
                      <div className="flex flex-wrap gap-4">
                        {productReview.map((el, index) => {
                          return (
                            <div
                              key={index}
                              className="border-2 p-4 my-2 flex flex-col gap-4 relative"
                            >
                              {el.user === user?._id && (
                                <div
                                  className="absolute text-red-400 top-0 right-0"
                                  onClick={() => deleteReviewApi()}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-6 h-6"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </div>
                              )}
                              <div className="flex flex-col md:flex-row gap-4">
                                <h1>
                                  <span className="text-lg font-bold mr-2">
                                    User:
                                  </span>
                                  {el.name}
                                </h1>
                                <div className="flex">
                                  <span className="text-lg font-bold mr-2">
                                    Rating:
                                  </span>
                                  <Star ratings={el.rating} />
                                </div>
                              </div>
                              <p>
                                <span className="text-lg font-bold mr-2">
                                  Comments:
                                </span>
                                {el.comments}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p>No reviews for this product yet</p>
                    )}
                  </div>
                </section>
              </>
            ))}
        </>
      )}

      {alert && <Alert text="Added to cart successfully" />}
    </main>
  );
};

export default ProductDetail;
