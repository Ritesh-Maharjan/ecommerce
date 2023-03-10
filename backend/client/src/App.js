import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./component/Navbar";
import ProtectedRoute from "./component/ProtectedRoute";
import Cart from "./component/Cart";
import CreateProduct from "./page/CreateProduct";
import Homepage from "./page/Homepage";
import Login from "./page/Login";
import NotFound from "./page/NotFound";
import ProductDetail from "./page/ProductDetail";
import Register from "./page/Register";
import Profile from "./page/Profile";
import Shipping from "./page/Shipping";
import UpdateProduct from "./page/UpdateProduct";
import Success from "./page/Success";
import Orders from "./page/Orders";
import Loggedin from "./component/Loggedin";
import ForgottenPassword from "./page/ForgottenPassword";
import ResetPassword from "./page/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-800 text-white ">
        <div>
          <Navbar />
          <Cart />
          <Routes path="/">
            <Route index element={<Homepage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/" element={<ProtectedRoute />}>
              <Route path="/create" element={<CreateProduct />} />
              <Route path="/update/:id" element={<UpdateProduct />} />
            </Route>
            <Route path="/" element={<Loggedin />}>
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/success" element={<Success />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="login" element={<Login />} />
            <Route path="forgottenpassword" element={<ForgottenPassword />} />
            <Route
              path="/password/reset/:token"
              element={<ResetPassword />}
            />
            <Route path="register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
