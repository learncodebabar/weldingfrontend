import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import { API_ENDPOINTS } from "../api/EndPoints";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import "./SalesPOS.css";
import { VITE_BACKEND_URL } from "../config/config";

const playBeep = (type = "success") => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    if (type === "success") {
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === "error") {
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime + 0.1);
      gainNode.gain.value = 0.3;
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } else if (type === "add") {
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.2;
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.05);
    }
  } catch (e) {}
};

// ── Compact Cart Item ──
const CartItem = ({
  item,
  updateItem,
  updateQty,
  removeItem,
  getImageUrl,
  itemTotal,
}) => (
  <div className="cart-item-row">
    <img
      src={getImageUrl(item.image)}
      alt={item.name}
      onError={(e) => {
        e.target.src = "/placeholder-product.png";
      }}
    />

    <div className="cart-item-info">
      <div className="cart-item-name" title={item.name}>
        {item.name}
      </div>
      <div className="cart-item-price">
        <input
          type="number"
          className="form-control cart-price-input d-inline-block"
          value={item.customPrice}
          onChange={(e) =>
            updateItem(item.cartItemId, "customPrice", e.target.value)
          }
          title="Price"
        />
      </div>
    </div>

    {/* Qty controls */}
    <div className="cart-item-controls">
      <button
        className="btn btn-outline-secondary qty-btn"
        onClick={() => updateQty(item.id, item.qty - 1, item.cartItemId)}
      >
        <i className="bi bi-dash"></i>
      </button>
      <span className="qty-display">{item.qty}</span>
      <button
        className="btn btn-outline-secondary qty-btn"
        onClick={() => updateQty(item.id, item.qty + 1, item.cartItemId)}
      >
        <i className="bi bi-plus"></i>
      </button>
      {/* ✅ FIX 2: Delete does qty-1 (not full remove). Removes item only when qty reaches 0 */}
      <button
        className="btn btn-outline-danger delete-btn"
        onClick={() => updateQty(item.id, item.qty - 1, item.cartItemId)}
        title="Remove one"
      >
        <i className="bi bi-trash3"></i>
      </button>
    </div>

    <div className="cart-item-total">RS{itemTotal(item).toFixed(0)}</div>
  </div>
);

// ── Cart Content ──
const CartContent = ({
  cart,
  isMobile = false,
  updateItem,
  updateQty,
  removeItem,
  getImageUrl,
  itemTotal,
  subtotal,
  discount,
  setDiscount,
  serviceCharge,
  setServiceCharge,
  taxRate,
  setTaxRate,
  globalDiscountAmount,
  tax,
  total,
  loading,
  handleCompleteSale,
}) => (
  <>
    <div className={isMobile ? "mobile-cart-body" : "card-body"}>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <i className="bi bi-cart d-block mb-2"></i>
          <p>Cart is empty</p>
        </div>
      ) : (
        cart.map((item) => (
          <CartItem
            key={item.cartItemId}
            item={item}
            updateItem={updateItem}
            updateQty={updateQty}
            removeItem={removeItem}
            getImageUrl={getImageUrl}
            itemTotal={itemTotal}
          />
        ))
      )}
    </div>

    {cart.length > 0 && (
      <div className={isMobile ? "mobile-cart-footer" : "card-footer border-0"}>
        <div className="cart-totals">
          <div className="total-row">
            <span>Subtotal</span>
            <span>RS{subtotal.toFixed(0)}</span>
          </div>

          <div className="total-row">
            <span>Discount %</span>
            <div className="d-flex align-items-center gap-1">
              <input
                type="number"
                className="form-control discount-input"
                value={discount}
                min="0"
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              />
              <span className="text-danger small">
                -RS{globalDiscountAmount.toFixed(0)}
              </span>
            </div>
          </div>

          <div className="total-row">
            <span>Service RS</span>
            <div className="d-flex align-items-center gap-1">
              <input
                type="number"
                className="form-control discount-input"
                value={serviceCharge}
                min="0"
                onChange={(e) => setServiceCharge(Number(e.target.value) || 0)}
              />
              <span className="text-primary small">
                +RS{serviceCharge.toFixed(0)}
              </span>
            </div>
          </div>

          <div className="total-row">
            <span>Tax %</span>
            <div className="d-flex align-items-center gap-1">
              <input
                type="number"
                className="form-control discount-input"
                value={taxRate}
                min="0"
                step="0.1"
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
              />
              <span className="text-primary small">+RS{tax.toFixed(0)}</span>
            </div>
          </div>

          <div className="total-row total-final">
            <span>Total</span>
            <span>RS{total.toFixed(0)}</span>
          </div>
        </div>

        <button
          className="btn btn-primary w-100 complete-order-btn mt-2"
          onClick={handleCompleteSale}
          disabled={loading}
        >
          {loading ? "Processing..." : "Complete Order"}
        </button>
      </div>
    )}
  </>
);

export default function SalesPOS() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [saleType, setSaleType] = useState("cash");
  const [permanentCustomers, setPermanentCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [tempCustomer, setTempCustomer] = useState({ name: "", phone: "" });
  const [discount, setDiscount] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState("camera");
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment");
  const [scannerError, setScannerError] = useState("");
  const [lastScannedBarcode, setLastScannedBarcode] = useState(null);
  const [scanCooldown, setScanCooldown] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const html5QrcodeRef = useRef(null);
  const fileInputRef = useRef(null);

  const [shopSettings, setShopSettings] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState([
    { method: "cash", amount: "", detail: "" },
  ]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaleId, setLastSaleId] = useState(null);
  const [lastSaleTotal, setLastSaleTotal] = useState(0);
  const [lastSaleChange, setLastSaleChange] = useState(0);
  const [lastSaleItems, setLastSaleItems] = useState([]);
  const [lastSaleCustomerName, setLastSaleCustomerName] = useState("");
  const [toasts, setToasts] = useState([]);

  const { addNotification } = useNotifications();
  const { theme } = useTheme();

  const paymentMethods = [
    { value: "cash", label: "Cash", icon: "bi-cash-stack", placeholder: "" },
    {
      value: "card",
      label: "Card",
      icon: "bi-credit-card",
      placeholder: "Last 4 digits",
    },
    { value: "upi", label: "UPI", icon: "bi-phone", placeholder: "UPI ID" },
    {
      value: "easypaisa",
      label: "EasyPaisa",
      icon: "bi-wallet2",
      placeholder: "Mobile Number",
    },
    {
      value: "jazzcash",
      label: "JazzCash",
      icon: "bi-wallet",
      placeholder: "Mobile Number",
    },
    {
      value: "bank",
      label: "Bank Transfer",
      icon: "bi-bank",
      placeholder: "Reference No",
    },
  ];

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchShopSettings();
    fetchPermanentCustomers();
  }, []);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  useEffect(() => {
    if (lastScannedBarcode) {
      const t = setTimeout(() => setLastScannedBarcode(null), 3000);
      return () => clearTimeout(t);
    }
  }, [lastScannedBarcode]);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraPermission(true);
    } catch {
      setCameraPermission(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
      });
      stream.getTracks().forEach((t) => t.stop());
      setCameraPermission(true);
      return true;
    } catch {
      setCameraPermission(false);
      setScannerError(
        "Camera access denied. Please enable camera in browser settings.",
      );
      return false;
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.CATEGORIES);
      setCategories(res.data || []);
    } catch {
      showAlertAndNotify("error", "Unable to load categories");
    }
  };

  useEffect(() => {
    let mounted = true;
    const startScanner = async () => {
      if (!showScanner || scanMode !== "camera" || scannerStarted) return;
      if (cameraPermission === false) {
        const granted = await requestCameraPermission();
        if (!granted) return;
      }
      try {
        setScannerError("");
        const scanner = new Html5Qrcode("barcode-reader");
        html5QrcodeRef.current = scanner;
        const cameras = await Html5Qrcode.getCameras();
        if (cameras?.length > 0) {
          const cam =
            cameras.find((c) => c.label.toLowerCase().includes("back")) ||
            cameras[0];
          await scanner.start(
            cam.id,
            {
              fps: 5,
              qrbox: (w, h) => {
                const s = Math.floor(Math.min(w, h) * 0.6);
                return { width: s, height: s };
              },
              aspectRatio: 1.0,
              formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
              ],
            },
            onScanSuccess,
            onScanError,
          );
          if (mounted) {
            setScannerStarted(true);
            setScannerError("");
          }
        } else {
          setScannerError("No camera found! Use Image Upload mode.");
        }
      } catch (err) {
        if (mounted)
          setScannerError(
            "Failed to start camera: " + (err.message || "Unknown error"),
          );
      }
    };
    if (showScanner && scanMode === "camera") setTimeout(startScanner, 200);
    return () => {
      mounted = false;
    };
  }, [showScanner, scanMode, cameraFacing, cameraPermission]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // ✅ FIX 1: removed duplicate showAlertAndNotify call after addToCart.
  // addToCart itself shows the notification — calling it again here caused double toast.
  const onScanSuccess = (decodedText) => {
    if (scanCooldown) return;
    setScanCooldown(true);
    setTimeout(() => setScanCooldown(false), 1000);
    setLastScannedBarcode(decodedText);
    const product = products.find(
      (p) => p.barcode === decodedText || p.sku === decodedText,
    );
    if (product) {
      playBeep("success");
      addToCart(product); // ← notification comes from inside addToCart only
    } else {
      playBeep("error");
      showAlertAndNotify("error", `Barcode "${decodedText}" not found!`);
    }
  };

  const onScanError = () => {};

  const stopScanner = async () => {
    if (html5QrcodeRef.current && scannerStarted) {
      try {
        await html5QrcodeRef.current.stop();
        await html5QrcodeRef.current.clear();
        html5QrcodeRef.current = null;
        setScannerStarted(false);
      } catch {}
    }
  };

  const toggleScanner = async () => {
    if (showScanner) {
      await stopScanner();
      setShowScanner(false);
      setScannerError("");
    } else {
      setShowScanner(true);
      if (cameraPermission === null) await checkCameraPermission();
    }
  };

  const switchCamera = async () => {
    await stopScanner();
    setCameraFacing((f) => (f === "environment" ? "user" : "environment"));
    setScannerStarted(false);
  };

  // ✅ FIX 1 (image upload): same fix — removed duplicate showAlertAndNotify after addToCart
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      showAlertAndNotify("info", "Scanning image...");
      const scanner = new Html5Qrcode("image-reader");
      const result = await scanner.scanFile(file, true);
      const product = products.find(
        (p) => p.barcode === result || p.sku === result,
      );
      if (product) {
        playBeep("success");
        addToCart(product); // ← notification comes from inside addToCart only
        setShowScanner(false);
      } else {
        playBeep("error");
        showAlertAndNotify("error", `Barcode "${result}" not found!`);
      }
    } catch {
      playBeep("error");
      showAlertAndNotify("error", "No barcode found in image.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fetchShopSettings = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.SHOP_SETTINGS);
      setShopSettings(res.data);
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.PRODUCTS);
      setProducts(res.data || []);
    } catch {}
  };

  const fetchPermanentCustomers = async () => {
    try {
      const res = await api.get(API_ENDPOINTS.PERMANENT);
      setPermanentCustomers(res.data || []);
    } catch {}
  };

  const showAlertAndNotify = useCallback(
    (type, message) => {
      const id = Date.now() + Math.random();
      const icons = {
        success: "✓",
        error: "✕",
        warning: "⚠",
        "low-stock": "📦",
        info: "ℹ",
      };
      setToasts((prev) => [
        ...prev.slice(-4),
        { id, type, message, icon: icons[type] || "ℹ" },
      ]);
      setTimeout(() => removeToast(id), type === "success" ? 2500 : 4000);
      addNotification(type === "low-stock" ? "low-stock" : type, message);
    },
    [removeToast, addNotification],
  );

  const filteredPermanentCustomers = permanentCustomers.filter(
    (c) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch),
  );

  const filteredProducts = products.filter((p) => {
    const catMatch = !selectedCategoryId || p.category === selectedCategoryId;
    const searchMatch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.includes(searchQuery) ||
      p.sku?.includes(searchQuery);
    return catMatch && searchMatch;
  });

  const addToCart = (product) => {
    if (!product.salePrice) {
      showAlertAndNotify("error", "Price not available");
      return;
    }
    if (product.stock <= 0) {
      showAlertAndNotify("error", `${product.name} is out of stock!`);
      return;
    }
    const productId = product.id || product._id;
    if (!productId) {
      showAlertAndNotify("error", "Invalid product: missing ID");
      return;
    }

    // ✅ Read cart snapshot OUTSIDE setCart to avoid calling side effects
    // (notifications/beeps) twice in React StrictMode
    setCart((prev) => {
      const existing = prev.find((item) => (item.id || item._id) == productId);
      if (existing) {
        if (existing.qty + 1 > product.stock) return prev; // guard only, no side effect
        return prev.map((item) =>
          (item.id || item._id) == productId
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      } else {
        return [
          ...prev,
          {
            ...product,
            id: productId,
            _id: productId,
            qty: 1,
            customPrice: product.salePrice,
            itemDiscount: 0,
            cartItemId: `${productId}-${Date.now()}-${Math.random()}`,
          },
        ];
      }
    });

    // Side effects (beep + toast) called ONCE outside setCart
    const currentItem = cart.find((item) => (item.id || item._id) == productId);
    if (currentItem) {
      if (currentItem.qty + 1 > product.stock) {
        showAlertAndNotify("error", `Only ${product.stock} available!`);
        return;
      }
      playBeep("add");
      showAlertAndNotify("success", `${product.name} × ${currentItem.qty + 1}`);
    } else {
      playBeep("add");
      showAlertAndNotify("success", `${product.name} added to cart`);
    }
  };

  const updateItem = useCallback((cartItemId, field, value) => {
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId == cartItemId
          ? { ...item, [field]: Number(value) || 0 }
          : item,
      ),
    );
  }, []);

  const updateQty = useCallback(
    (productId, qty, cartItemId) => {
      setCart((prev) => {
        const item = prev.find((i) => i.cartItemId == cartItemId);
        if (!item) return prev;
        const product = products.find(
          (p) => (p.id || p._id) == (item.id || item._id),
        );
        if (qty > (product?.stock || 0)) {
          showAlertAndNotify("error", `Only ${product?.stock} in stock!`);
          return prev;
        }
        if (qty <= 0) return prev.filter((i) => i.cartItemId != cartItemId);
        return prev.map((i) =>
          i.cartItemId == cartItemId ? { ...i, qty } : i,
        );
      });
    },
    [products],
  );

  // removeItem kept for any future use but delete button now uses updateQty
  const removeItem = useCallback((cartItemId) => {
    setCart((prev) => prev.filter((i) => i.cartItemId != cartItemId));
  }, []);

  const itemTotal = (item) =>
    ((item.customPrice || 0) - (item.itemDiscount || 0)) * item.qty;

  const subtotal = cart.reduce((sum, item) => sum + itemTotal(item), 0);
  const globalDiscountAmount = (subtotal * discount) / 100;
  const tax = (subtotal - globalDiscountAmount) * (taxRate / 100);
  const total = subtotal - globalDiscountAmount + serviceCharge + tax;
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const remaining = total - totalPaid;
  const change = remaining < 0 ? Math.abs(remaining) : 0;

  const addPaymentMethod = () =>
    setPayments([...payments, { method: "cash", amount: "", detail: "" }]);
  const updatePayment = (i, field, value) => {
    const p = [...payments];
    p[i][field] = value;
    setPayments(p);
  };
  const removePayment = (i) =>
    setPayments(payments.filter((_, idx) => idx !== i));

  const handleCompleteSale = () => {
    if (cart.length === 0) {
      showAlertAndNotify("error", "Cart is empty");
      return;
    }
    setShowMobileCart(false);
    setShowPaymentModal(true);
  };

  const processSale = async () => {
    let customerId = null,
      customerInfo = null,
      customerName = "";
    if (saleType === "permanent") {
      if (!selectedCustomer) {
        showAlertAndNotify("error", "Select a customer");
        return;
      }
      const cust = permanentCustomers.find(
        (c) => (c.id || c._id) == selectedCustomer,
      );
      customerId = selectedCustomer;
      customerName = cust?.name || "";
    } else if (saleType === "temporary") {
      if (!tempCustomer.name.trim()) {
        showAlertAndNotify("error", "Enter customer name");
        return;
      }
      customerInfo = tempCustomer;
      customerName = tempCustomer.name;
    }

    const invalidItems = cart.filter(
      (item) => !item.id || isNaN(parseInt(item.id)) || parseInt(item.id) <= 0,
    );
    if (invalidItems.length > 0) {
      showAlertAndNotify(
        "error",
        `Invalid product IDs: ${invalidItems.map((i) => i.name).join(", ")}`,
      );
      return;
    }

    const saleData = {
      items: cart.map((item) => ({
        product: parseInt(item.id || item._id),
        name: item.name,
        qty: item.qty,
        price: parseFloat(item.customPrice) || 0,
        itemDiscount: parseFloat(item.itemDiscount) || 0,
      })),
      customer: customerId ? parseInt(customerId) : null,
      customerInfo,
      saleType,
      payments:
        saleType === "cash"
          ? payments
              .map((p) => ({
                method: p.method,
                amount: parseFloat(p.amount) || 0,
                detail: p.detail || "",
              }))
              .filter((p) => p.amount > 0)
          : [],
      paidAmount: saleType === "cash" ? parseFloat(totalPaid) || 0 : 0,
      subtotal: parseFloat(subtotal) || 0,
      discountPercent: parseFloat(discount) || 0,
      serviceCharge: parseFloat(serviceCharge) || 0,
      tax: parseFloat(tax) || 0,
      total: parseFloat(total) || 0,
    };

    try {
      setLoading(true);
      const response = await api.post(API_ENDPOINTS.SALE, saleData);
      const newSale = response.data;
      setLastSaleId(newSale.id || newSale.saleNumber || `SALE-${Date.now()}`);
      setLastSaleTotal(total);
      setLastSaleChange(change);
      setLastSaleItems([...cart]);
      setLastSaleCustomerName(customerName);
      showAlertAndNotify("success", `Sale completed! RS${total.toFixed(0)}`);
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      setCart([]);
    } catch (err) {
      showAlertAndNotify(
        "error",
        `Sale failed: ${err.response?.data?.message || err.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAfterSale = () => {
    setCart([]);
    setDiscount(0);
    setServiceCharge(0);
    setTaxRate(0);
    setTempCustomer({ name: "", phone: "" });
    setSelectedCustomer("");
    setCustomerSearch("");
    setSaleType("cash");
    setPayments([{ method: "cash", amount: "", detail: "" }]);
    setShowSuccessModal(false);
  };

  const getShortSaleId = () => {
    if (!lastSaleId) return "N/A";
    if (typeof lastSaleId === "string")
      return lastSaleId.slice(-6).toUpperCase();
    return `#${lastSaleId}`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder-product.png";
    if (imagePath.startsWith("http") || imagePath.startsWith("data:image"))
      return imagePath;
    const cleanPath = imagePath.startsWith("/")
      ? imagePath.slice(1)
      : imagePath;
    return `${VITE_BACKEND_URL}/${cleanPath}`;
  };

  const handlePrintReceipt = () => {
    const receiptSubtotal = lastSaleItems.reduce(
      (sum, item) =>
        sum + ((item.customPrice || 0) - (item.itemDiscount || 0)) * item.qty,
      0,
    );
    const receiptDiscountAmount = (receiptSubtotal * discount) / 100;
    const receiptTax =
      (receiptSubtotal - receiptDiscountAmount) * (taxRate / 100);
    const now = new Date();
    const receiptHTML = `
      <div style="font-family:monospace;max-width:300px;margin:0 auto;padding:20px;">
        <div style="text-align:center;margin-bottom:15px;">
          <h2 style="margin:0;font-size:18px;">${shopSettings?.shopName || "My Shop"}</h2>
          <p style="margin:4px 0;font-size:12px;">${shopSettings?.address || ""}</p>
          <p style="margin:4px 0;font-size:12px;">Tel: ${shopSettings?.phone || ""}</p>
        </div>
        <hr style="border:dashed 1px #000;margin:10px 0;">
        <div style="font-size:12px;margin-bottom:10px;">
          <p style="margin:3px 0;"><strong>Date:</strong> ${now.toLocaleDateString("en-GB")} ${now.toLocaleTimeString()}</p>
          <p style="margin:3px 0;"><strong>Receipt #:</strong> ${getShortSaleId()}</p>
          ${lastSaleCustomerName ? `<p style="margin:3px 0;"><strong>Customer:</strong> ${lastSaleCustomerName}</p>` : ""}
        </div>
        <hr style="border:dashed 1px #000;margin:10px 0;">
        <table style="width:100%;font-size:12px;margin-bottom:10px;">
          <thead><tr><th style="text-align:left;">Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Total</th></tr></thead>
          <tbody>
            ${lastSaleItems
              .map((item) => {
                const fp = (item.customPrice || 0) - (item.itemDiscount || 0);
                return `<tr><td>${item.name.length > 20 ? item.name.substring(0, 17) + "..." : item.name}</td>
                <td style="text-align:center;">${item.qty}</td>
                <td style="text-align:right;">RS${(fp * item.qty).toFixed(0)}</td></tr>`;
              })
              .join("")}
          </tbody>
        </table>
        <hr style="border:dashed 1px #000;margin:10px 0;">
        <div style="text-align:right;font-size:13px;">
          <p style="margin:4px 0;"><strong>Subtotal:</strong> RS${receiptSubtotal.toFixed(0)}</p>
          ${discount > 0 ? `<p style="margin:4px 0;"><strong>Discount(${discount}%):</strong> -RS${receiptDiscountAmount.toFixed(0)}</p>` : ""}
          ${serviceCharge > 0 ? `<p style="margin:4px 0;"><strong>Service:</strong> RS${serviceCharge.toFixed(0)}</p>` : ""}
          ${taxRate > 0 ? `<p style="margin:4px 0;"><strong>Tax(${taxRate}%):</strong> RS${receiptTax.toFixed(0)}</p>` : ""}
          <p style="margin:8px 0;font-size:16px;border-top:2px solid #000;padding-top:8px;"><strong>TOTAL: RS${lastSaleTotal.toFixed(0)}</strong></p>
          ${lastSaleChange > 0 ? `<p style="color:#28a745;margin:4px 0;"><strong>Change: RS${lastSaleChange.toFixed(0)}</strong></p>` : ""}
        </div>
        <hr style="border:dashed 1px #000;margin:10px 0;">
        <p style="text-align:center;font-size:12px;">Thank you for shopping!</p>
      </div>`;
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
      <style>@media print{body{padding:0;margin:0;}} body{font-family:'Courier New',monospace;}</style>
      </head><body><div>${receiptHTML}</div>
      <script>window.onload=function(){window.print();setTimeout(function(){window.close();},1000);}<\/script>
      </body></html>`);
    w.document.close();
  };

  const cartProps = {
    cart,
    updateItem,
    updateQty,
    removeItem,
    getImageUrl,
    itemTotal,
    subtotal,
    discount,
    setDiscount,
    serviceCharge,
    setServiceCharge,
    taxRate,
    setTaxRate,
    globalDiscountAmount,
    tax,
    total,
    loading,
    handleCompleteSale,
  };

  return (
    <div className="pos-container">
      {/* Toast Stack */}
      <div className="pos-toast-stack">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pos-toast pos-toast-${t.type === "success" ? "success" : t.type === "warning" || t.type === "low-stock" ? "warning" : t.type === "info" ? "info" : "danger"}`}
          >
            <span className="pos-toast-icon">{t.icon}</span>
            <span className="pos-toast-msg">{t.message}</span>
            <button
              className="pos-toast-close"
              onClick={() => removeToast(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {scanCooldown && showScanner && (
        <div className="scan-cooldown">
          <i className="bi bi-camera me-2"></i>Processing...
        </div>
      )}

      <div className="pos-main-layout">
        {/* Products Section */}
        <div className="products-section">
          {/* Search + Scanner */}
          <div className="bg-body rounded-3 shadow-sm p-2 search-scanner-section">
            <div className="row g-2 align-items-center">
              <div className="col">
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-pill ps-4"
                    placeholder="Search name, barcode, SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                  <i
                    className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                    style={{ fontSize: "11px" }}
                  ></i>
                </div>
              </div>
              <div className="col-auto">
                <button
                  className={`btn btn-sm ${showScanner ? "btn-danger" : "btn-primary"}`}
                  onClick={toggleScanner}
                >
                  <i
                    className={`bi ${showScanner ? "bi-x-circle" : "bi-upc-scan"}`}
                  ></i>
                </button>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="category-buttons-wrapper mb-0">
            <div className="d-flex gap-1 category-buttons">
              <button
                className={`btn btn-sm ${!selectedCategoryId ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setSelectedCategoryId(null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  className={`btn btn-sm ${selectedCategoryId === cat._id ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setSelectedCategoryId(cat._id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-grow-1 overflow-auto products-grid">
            {filteredProducts.map((product) => {
              const productId = product.id || product._id;
              return (
                <div
                  key={productId}
                  className="card product-card shadow-sm position-relative"
                  onClick={() => addToCart(product)}
                >
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className="card-img-top"
                    onError={(e) => {
                      e.target.src = "/placeholder-product.png";
                    }}
                  />
                  <div className="card-body">
                    <h6 className="fw-bold text-truncate">
                      {product.name || "Unnamed"}
                    </h6>
                    <small
                      className={`d-block ${product.stock <= 0 ? "text-danger" : product.stock <= (product.minStockAlert || 10) ? "text-warning" : "text-muted"}`}
                    >
                      Stock: {product.stock || 0}
                    </small>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <span className="fw-bold text-primary">
                        RS{product.salePrice || "0"}
                      </span>
                      <button className="btn bg-primary product-add-btn">
                        <i className="bi bi-plus text-white"></i>
                      </button>
                    </div>
                  </div>
                  {product.stock <= 0 && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center rounded-3">
                      <span className="badge bg-danger">Out of Stock</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Cart */}
        <div className="cart-section">
          <div className="card border-0 shadow-sm h-100 rounded-3">
            <div className="card-header border-0 bg-transparent">
              <h4 className="mb-0 fw-bold">
                <i className="bi bi-cart3 me-2 text-primary"></i>Cart
                {cart.length > 0 && (
                  <span
                    className="badge bg-primary ms-2"
                    style={{ fontSize: "11px" }}
                  >
                    {cart.length}
                  </span>
                )}
              </h4>
            </div>
            <CartContent {...cartProps} isMobile={false} />
          </div>
        </div>
      </div>

      {/* Floating Cart (Mobile) */}
      <button
        className="floating-cart-btn"
        onClick={() => setShowMobileCart(true)}
      >
        <i className="bi bi-cart3"></i>
        {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
      </button>

      {/* Mobile Cart Modal */}
      {showMobileCart && (
        <div className={`mobile-cart-modal ${showMobileCart ? "show" : ""}`}>
          <div className="mobile-cart-header">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-cart3 me-2"></i>Cart
            </h5>
            <button
              className="btn btn-sm btn-close"
              onClick={() => setShowMobileCart(false)}
            ></button>
          </div>
          <CartContent {...cartProps} isMobile={true} />
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.9)", zIndex: 2050 }}
        >
          <div className="bg-body rounded-4 p-3 scanner-modal-mobile">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-upc-scan me-2"></i>Scan Barcode
              </h6>
              <button
                className="btn btn-sm btn-danger rounded-circle"
                onClick={toggleScanner}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="btn-group w-100 mb-3" role="group">
              <button
                type="button"
                className={`btn btn-sm ${scanMode === "camera" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => {
                  setScanMode("camera");
                  setScannerError("");
                }}
              >
                <i className="bi bi-camera me-1"></i>Camera
              </button>
              <button
                type="button"
                className={`btn btn-sm ${scanMode === "image" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => {
                  stopScanner();
                  setScanMode("image");
                  setScannerError("");
                }}
              >
                <i className="bi bi-image me-1"></i>Upload
              </button>
            </div>
            {scannerError && (
              <div className="alert alert-danger py-2 mb-3 small">
                <i className="bi bi-exclamation-triangle me-1"></i>
                {scannerError}
                {scannerError.includes("denied") && (
                  <button
                    className="btn btn-sm btn-warning w-100 mt-2"
                    onClick={requestCameraPermission}
                  >
                    <i className="bi bi-arrow-repeat me-1"></i>Request Access
                    Again
                  </button>
                )}
              </div>
            )}
            {scanMode === "camera" && !scannerError && (
              <>
                <div
                  id="barcode-reader"
                  style={{
                    width: "100%",
                    borderRadius: "12px",
                    overflow: "hidden",
                    minHeight: "220px",
                  }}
                ></div>
                <button
                  className="btn btn-secondary btn-sm w-100 mt-2"
                  onClick={switchCamera}
                  disabled={!scannerStarted}
                >
                  <i className="bi bi-arrow-repeat me-1"></i>Switch Camera
                </button>
              </>
            )}
            {scanMode === "image" && (
              <>
                <div id="image-reader" style={{ display: "none" }}></div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
                <div
                  className="border rounded-3 p-4 text-center"
                  style={{ cursor: "pointer" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="bi bi-cloud-upload fs-3 text-primary d-block mb-2"></i>
                  <small>Click to upload barcode image</small>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered payment-modal-mobile">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white py-2">
                <h6 className="modal-title fw-bold mb-0">
                  Complete Sale — RS{total.toFixed(0)}
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPaymentModal(false)}
                ></button>
              </div>
              <div className="modal-body p-3">
                <div className="text-center mb-3">
                  <h3 className="fw-bold mb-0">RS{total.toFixed(0)}</h3>
                  <small className="text-muted">Total Amount</small>
                </div>

                <div className="mb-3 p-3 border rounded bg-body-secondary">
                  <label className="form-label fw-bold small mb-2">
                    Sale Type
                  </label>
                  <div className="btn-group w-100" role="group">
                    {["cash", "permanent", "temporary"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`btn btn-sm ${saleType === type ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => setSaleType(type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>

                  {saleType === "permanent" && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="form-control form-control-sm mb-2"
                        placeholder="Search customer..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                      <select
                        className="form-select form-select-sm"
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                      >
                        <option value="">Choose Customer *</option>
                        {filteredPermanentCustomers.map((c) => {
                          const cId = c.id || c._id;
                          return (
                            <option key={cId} value={cId}>
                              {c.name} ({c.phone || "No phone"}) — Due: RS
                              {c.remainingDue || 0}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {saleType === "temporary" && (
                    <div className="row g-2 mt-2">
                      <div className="col-6">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Customer Name *"
                          value={tempCustomer.name}
                          onChange={(e) =>
                            setTempCustomer({
                              ...tempCustomer,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-6">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Phone"
                          value={tempCustomer.phone}
                          onChange={(e) =>
                            setTempCustomer({
                              ...tempCustomer,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {saleType === "cash" && (
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2 small">Payment Methods</h6>
                    {payments.map((payment, index) => {
                      const methodInfo = paymentMethods.find(
                        (m) => m.value === payment.method,
                      );
                      return (
                        <div key={index} className="mb-2 p-2 border rounded">
                          <div className="row g-2 align-items-center">
                            <div className="col-4">
                              <select
                                className="form-select form-select-sm"
                                value={payment.method}
                                onChange={(e) =>
                                  updatePayment(index, "method", e.target.value)
                                }
                              >
                                {paymentMethods.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-4">
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                placeholder="Amount"
                                value={payment.amount}
                                onChange={(e) =>
                                  updatePayment(index, "amount", e.target.value)
                                }
                              />
                            </div>
                            {payment.method !== "cash" && (
                              <div className="col-3">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder={
                                    methodInfo?.placeholder || "Detail"
                                  }
                                  value={payment.detail || ""}
                                  onChange={(e) =>
                                    updatePayment(
                                      index,
                                      "detail",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            )}
                            {payments.length > 1 && (
                              <div className="col-1">
                                <button
                                  className="btn btn-sm btn-outline-danger p-0"
                                  style={{ width: "24px", height: "24px" }}
                                  onClick={() => removePayment(index)}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <button
                      className="btn btn-outline-primary btn-sm w-100"
                      onClick={addPaymentMethod}
                    >
                      <i className="bi bi-plus me-1"></i>Add Method
                    </button>
                  </div>
                )}

                {saleType === "cash" && (
                  <div className="bg-body-secondary p-3 rounded small">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Paid</span>
                      <span className="fw-bold text-success">
                        RS{totalPaid.toFixed(0)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Remaining</span>
                      <span
                        className={`fw-bold ${remaining > 0 ? "text-danger" : "text-success"}`}
                      >
                        RS{remaining.toFixed(0)}
                      </span>
                    </div>
                    {change > 0 && (
                      <div className="d-flex justify-content-between">
                        <span>Change</span>
                        <span className="fw-bold text-success">
                          RS{change.toFixed(0)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer py-2">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm px-4"
                  onClick={processSale}
                  disabled={(saleType === "cash" && remaining > 0) || loading}
                >
                  {loading ? "Processing..." : "Complete Sale"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-sm modal-dialog-centered success-modal-mobile">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white py-2">
                <h6 className="modal-title fw-bold mb-0">
                  <i className="bi bi-check-circle-fill me-2"></i>Sale
                  Completed!
                </h6>
              </div>
              <div className="modal-body text-center py-3">
                <i className="bi bi-check-circle display-3 text-success mb-2 d-block"></i>
                <h4 className="fw-bold">RS{lastSaleTotal.toFixed(0)}</h4>
                {lastSaleChange > 0 && (
                  <p className="text-success fw-bold mb-1">
                    Change: RS{lastSaleChange.toFixed(0)}
                  </p>
                )}
                <small className="text-muted">ID: #{getShortSaleId()}</small>
              </div>
              <div className="modal-footer justify-content-center gap-2 py-2">
                <button
                  className="btn btn-success btn-sm px-3"
                  onClick={handlePrintReceipt}
                >
                  <i className="bi bi-printer me-1"></i>Print
                </button>
                <button
                  className="btn btn-outline-primary btn-sm px-3"
                  onClick={resetAfterSale}
                >
                  New Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
