"use client";

import React, { useState } from "react";
import { CheckCircle, User, Building2, CreditCard, Settings, Eye, EyeOff, Loader2, ExternalLink } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// ---------------- Interfaces ----------------
interface PayrollDetails {
  
  income_type?: string;
  annual_salary?: string;
  hourly_rate?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  average_hours_per_week?: string;
  seasonal_variation?: string;
  estimated_annual_income?: string;
  filing_status?: string;
  pay_frequency?: string;
  current_withholding_per_paycheck?: string;
  desired_boost_per_paycheck?: string | null;
  additional_income?: string;
  deductions?: string;
  dependents?: string;
  spouse_income?: string;
}
interface paycheck{
  income_type?: string;
  salary?: string;
  filing_status?: string;
  pay_frequency?: string;
  // current_withholding_per_paycheck: string;
  spouse_income?: string;
  dependents?: string;
  home_address?: string;
  work_address?: string
  age?:number
  pre_tax_deductions?:string
  post_tax_deduction?:string
}

interface UserAndSessionId {
  payroll: PayrollDetails;
  // paycheck:paycheck
  company_name: string;
  email: string;
}

interface TokenPayload {
  client_id: string;
  client_secret: string;
}

interface FormErrors {
  [key: string]: string;
}

// ---------------- Mock API Functions (Replace with actual implementation) ----------------
const tokenStore = (data: any) => {
  console.log("Token stored:", data);
  localStorage.setItem("token",data.access_token)
  localStorage.setItem("refresh",data.refresh_token)
};



const tokenCreateFromClientIdAndSecret = async (payload: TokenPayload) => {

  try{
  const response=await axios.post('https://api-be.musetax.com/auth/token',payload)
  console.log(response,"==========")
  const mockResponse = { access_token: response.data.access_token, refresh_token:response.data.refresh_token };
  tokenStore(mockResponse);
  return mockResponse;
  }catch(error:any){
 
        throw error
        // return mockResponse

  }
};

const storeSessionId = (session_id: string) => {
  console.log("Session stored:", session_id);
};

const getUserAndSessionId = async (payload: UserAndSessionId) => {
  let token=localStorage.getItem('token')
  const respone=await axios.post(`https://amus-devapi.musetax.com/v1/api/amus/user`,payload,
    {
      headers:{
        Authorization:`Bearer ${token}`
      }
    }
  )
  if(respone.data.user_id)
  {
    const getSessionId=await axios.post(`https://amus-devapi.musetax.com/v1/api/amus/session`,{user_id:respone.data.user_id},{
      headers:{
        Authorization:`Bearer ${token}`
      }
    })
    storeSessionId(getSessionId.data.session_id);
    return {
      user_id:respone.data.user_id,
      session_id:getSessionId.data.session_id
    };
  }
  else{
     return {
      user_id:respone.data.user_id,
      session_id:''
    };

  }

};

// ---------------- Component ----------------
export default function AuthForm() {
  const [formData, setFormData] = useState({
    client_id: "",
    client_secret: "",
    company_name: "",
    first_name: "",
    last_name: "",
    email: "",
    chattype: "ukg-ready",
    income_type: "",
    annual_salary: "",
    hourly_rate: "",
    average_hours_per_week: "",
    filing_status: "",
    pay_frequency: "",
    current_withholding_per_paycheck: "",
    desired_boost_per_paycheck: "",
    additional_income: "",
    deductions: "",
    dependents: "",
    spouse_income: "",
    existing_user_id: "",
    existing_session_id: "",
  });

  const [useExistingCredentials, setUseExistingCredentials] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    { id: 1, name: "API Configuration", icon: Settings },
    { id: 2, name: "User Information", icon: User },
    { id: 3, name: "Company Details", icon: Building2 },
    { id: 4, name: "Payroll Setup", icon: CreditCard },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.client_id.trim()) newErrors.client_id = "Client ID is required.";
    if (!formData.client_secret.trim()) newErrors.client_secret = "Client Secret is required.";
    
    if (useExistingCredentials) {
      if (!formData.existing_user_id.trim()) newErrors.existing_user_id = "User ID is required.";
      if (!formData.existing_session_id.trim()) newErrors.existing_session_id = "Session ID is required.";
    } else {
      if (!formData.first_name.trim()) newErrors.first_name = "First Name is required.";
      if (!formData.last_name.trim()) newErrors.last_name = "Last Name is required.";
      if (!formData.email.trim()) newErrors.email = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid.";
      if (!formData.company_name.trim()) newErrors.company_name = "Company Name is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



const showToast = (message: string, type: "success" | "error" = "success") => {
  if (type === "success") {
    toast.success(message);
  } else {
    toast.error(message);
  }
  console.log(`${type.toUpperCase()}: ${message}`);
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      Object.values(errors).forEach((error) => showToast(error, 'error'));
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Token
      const tokenData = await tokenCreateFromClientIdAndSecret({
        client_id: formData.client_id.trim(),
        client_secret: formData.client_secret.trim(),
      });
      showToast("Authentication successful","success");
      setCompletedSteps(prev => [...prev, 1]);

      // 2️⃣ Session - Use existing or create new
      let sessionData;
      if (useExistingCredentials) {
        sessionData = {
          user_id: formData.existing_user_id.trim(),
          session_id: formData.existing_session_id.trim()
        };
        showToast("Using existing user session");
        setCompletedSteps(prev => [...prev, 2, 3, 4]);
      } else {
        sessionData = await getUserAndSessionId({
          company_name: formData.company_name,
          email: formData.email,
          payroll: {
            first_name: formData.first_name,
          last_name: formData.last_name,
            income_type: formData.income_type || undefined,
            annual_salary: formData.annual_salary ? formData.annual_salary : undefined,
            hourly_rate: formData.hourly_rate ? formData.hourly_rate : undefined,
            average_hours_per_week: formData.average_hours_per_week ? formData.average_hours_per_week : undefined,
            filing_status: formData.filing_status || undefined,
            pay_frequency: formData.pay_frequency || undefined,
            current_withholding_per_paycheck: formData.current_withholding_per_paycheck ? formData.current_withholding_per_paycheck: undefined,
            additional_income: formData.additional_income ?formData.additional_income: undefined,
            deductions: formData.deductions ? formData.deductions : undefined,
            dependents: formData.dependents ? formData.dependents : undefined,
            spouse_income: formData.spouse_income ? formData.spouse_income: undefined,
          }
        });
        showToast("User session created successfully","success");
        setCompletedSteps(prev => [...prev, 2, 3, 4]);
      }

      // 3️⃣ Build iframe URL
      const url = new URL("https://chatbot-ten-beryl-86.vercel.app/");
      // const url = new URL("http://localhost:3000/");

      url.searchParams.append("user_id", sessionData.user_id.trim());
      url.searchParams.append("session_id", sessionData.session_id.trim());
      url.searchParams.append("access_token", tokenData.access_token);
      url.searchParams.append("refresh_token", tokenData.refresh_token);
      url.searchParams.append("client_id",formData.client_id.trim())
      url.searchParams.append("client_secret",formData.client_secret.trim())

      // url.searchParams.append("company_logo",'https://checkboost.com/_next/static/media/paycheck-img.895cf408.svg')
      // url.searchParams.append("user_image",'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bG9nb3xlbnwwfHwwfHx8MA%3D%3D')
      setIframeUrl(url.toString());
      setShowIframe(true);
      
      // window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

      setTimeout(() => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}, 100);

      showToast("Integration loaded successfully","success");
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || "An error occurred", 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-200 ${
      hasError 
        ? "border-red-300 focus:border-red-500 bg-red-50" 
        : "border-gray-200 focus:border-blue-500 bg-white hover:border-gray-300"
    }`;

  const selectClass = (hasError: boolean) =>
    `w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all duration-200 bg-white ${
      hasError 
        ? "border-red-300 focus:border-red-500" 
        : "border-gray-200 focus:border-blue-500 hover:border-gray-300"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-start gap-4">
            <div><svg xmlns="http://www.w3.org/2000/svg" width="153" height="41" viewBox="0 0 153 41" fill="none">
<path d="M12.5432 7.7788L1.18432 31.0648C-0.492537 34.5023 1.15373 38.0503 4.86135 38.9895C8.56904 39.9288 12.934 37.9033 14.6109 34.4659L25.9698 11.1799C27.6467 7.74244 26.0003 4.19426 22.2927 3.25516C18.585 2.31589 14.2201 4.34135 12.5432 7.7788Z" fill="url(#paint0_linear_2655_7773)"/>
<path d="M27.2373 7.42504L34.2297 21.7578C35.8752 25.1303 34.2601 28.6114 30.6224 29.5329C26.9848 30.4545 22.7022 28.4676 21.057 25.095L14.0644 10.7623C12.419 7.38976 14.0341 3.90867 17.6717 2.98722C21.3093 2.06558 25.5921 4.05249 27.2373 7.42504Z" fill="url(#paint1_linear_2655_7773)"/>
<path d="M29.4579 7.4423L22.485 21.7348C20.8342 25.1185 22.4544 28.611 26.1039 29.5358C29.7535 30.4603 34.0502 28.4668 35.7011 25.0832L42.6739 10.7907C44.3248 7.40703 42.7044 3.91448 39.0548 2.98994C35.4053 2.06521 31.1086 4.05866 29.4579 7.4423Z" fill="url(#paint2_linear_2655_7773)"/>
<path d="M44.7141 7.55224L56.1847 31.0671C57.8616 34.5046 56.2154 38.0528 52.5078 38.9919C48.8001 39.9311 44.4351 37.9057 42.7582 34.4682L31.2876 10.9533C29.6107 7.51588 31.2571 3.96769 34.9647 3.0286C38.6721 2.08933 43.0374 4.11478 44.7141 7.55224Z" fill="url(#paint3_linear_2655_7773)"/>
<g clip-path="url(#clip0_2655_7773)">
<path d="M143.991 32.1179C142.284 32.1179 140.78 31.7553 139.479 31.0299C138.199 30.2833 137.207 29.2379 136.503 27.8939C135.799 26.5499 135.447 24.9925 135.447 23.2219C135.447 21.5152 135.809 20.0005 136.535 18.6779C137.26 17.3552 138.263 16.3205 139.543 15.5739C140.823 14.8059 142.284 14.4219 143.927 14.4219C145.271 14.4219 146.487 14.6779 147.575 15.1899C148.684 15.6805 149.612 16.3845 150.359 17.3019C151.105 18.2192 151.639 19.2859 151.959 20.5019C152.279 21.6965 152.332 22.9872 152.119 24.3739H138.071V21.5579H147.415C147.372 20.3632 147.02 19.4245 146.359 18.7419C145.719 18.0379 144.876 17.6859 143.831 17.6859C142.999 17.6859 142.295 17.8992 141.719 18.3259C141.143 18.7525 140.695 19.3819 140.375 20.2139C140.076 21.0245 139.927 22.0272 139.927 23.2219C139.927 24.3952 140.076 25.3872 140.375 26.1979C140.673 27.0085 141.121 27.6272 141.719 28.0539C142.316 28.4805 143.041 28.6939 143.895 28.6939C144.876 28.6939 145.687 28.4592 146.327 27.9899C146.967 27.5205 147.415 26.8699 147.671 26.0379H152.087C151.596 27.9579 150.647 29.4513 149.239 30.5179C147.831 31.5845 146.081 32.1179 143.991 32.1179Z" fill="#042567"/>
<path d="M133.53 26.3579C133.53 28.1285 132.869 29.5365 131.546 30.5819C130.245 31.6273 128.378 32.1499 125.946 32.1499C123.535 32.1499 121.647 31.6059 120.282 30.5179C118.938 29.4085 118.181 27.9045 118.01 26.0059H122.266C122.287 26.8805 122.639 27.5845 123.322 28.1179C124.026 28.6299 124.922 28.8859 126.01 28.8859C126.885 28.8859 127.61 28.7473 128.186 28.4699C128.762 28.1712 129.05 27.7232 129.05 27.1259C129.05 26.5925 128.869 26.1872 128.506 25.9099C128.143 25.6325 127.546 25.4192 126.714 25.2699L123.642 24.6939C122.106 24.4165 120.901 23.8619 120.026 23.0299C119.151 22.1979 118.714 21.1205 118.714 19.7979C118.714 18.7312 119.002 17.7925 119.578 16.9819C120.154 16.1712 120.965 15.5419 122.01 15.0939C123.055 14.6459 124.282 14.4219 125.69 14.4219C127.119 14.4219 128.378 14.6672 129.466 15.1579C130.575 15.6272 131.45 16.3099 132.09 17.2059C132.751 18.1019 133.135 19.1579 133.242 20.3739H128.986C128.922 19.5419 128.591 18.8912 127.994 18.4219C127.397 17.9312 126.629 17.6859 125.69 17.6859C124.879 17.6859 124.218 17.8352 123.706 18.1339C123.215 18.4112 122.97 18.8272 122.97 19.3819C122.97 19.8939 123.151 20.2779 123.514 20.5339C123.877 20.7685 124.442 20.9605 125.21 21.1099L128.506 21.7179C130.17 22.0379 131.418 22.5819 132.25 23.3499C133.103 24.1179 133.53 25.1205 133.53 26.3579Z" fill="#042567"/>
<path d="M110.685 24.6282V14.7402H115.101V31.8282H111.037V29.5882C110.589 30.3348 109.917 30.9536 109.021 31.4442C108.125 31.9136 107.133 32.1482 106.045 32.1482C104.915 32.1482 103.901 31.9136 103.005 31.4442C102.109 30.9748 101.405 30.2602 100.893 29.3002C100.381 28.3189 100.125 27.0922 100.125 25.6202V14.7402H104.573V24.7562C104.573 25.9509 104.84 26.8256 105.373 27.3802C105.928 27.9349 106.653 28.2122 107.549 28.2122C108.083 28.2122 108.584 28.0736 109.053 27.7962C109.544 27.5189 109.939 27.1136 110.237 26.5802C110.536 26.0256 110.685 25.3749 110.685 24.6282Z" fill="#042567"/>
<path d="M81.4139 31.8295L75.3979 16.5655V31.8295H70.9819V8.85352H76.8059L83.4619 25.8775L90.1499 8.85352H95.9739V31.8295H91.5579V16.4375L85.4779 31.8295H81.4139Z" fill="#042567"/>
</g>
<defs>
<linearGradient id="paint0_linear_2655_7773" x1="3.97033" y1="38.7424" x2="28.0169" y2="7.19898" gradientUnits="userSpaceOnUse">
<stop stop-color="#69DEC6"/>
<stop offset="1" stop-color="#49C2D4"/>
</linearGradient>
<linearGradient id="paint1_linear_2655_7773" x1="16.5915" y1="3.52358" x2="43.5244" y2="35.2812" gradientUnits="userSpaceOnUse">
<stop stop-color="#48C2D4"/>
<stop offset="1" stop-color="#1595EA"/>
</linearGradient>
<linearGradient id="paint2_linear_2655_7773" x1="24.6711" y1="29.3519" x2="60.9891" y2="-12.1978" gradientUnits="userSpaceOnUse">
<stop stop-color="#1695EA"/>
<stop offset="1" stop-color="#548CE7"/>
</linearGradient>
<linearGradient id="paint3_linear_2655_7773" x1="35.8607" y1="2.52533" x2="60.0351" y2="35.4931" gradientUnits="userSpaceOnUse">
<stop stop-color="#518DE7"/>
<stop offset="1" stop-color="#7687E5"/>
</linearGradient>
<clipPath id="clip0_2655_7773">
<rect width="82" height="24" fill="white" transform="translate(70.9819 8.5)"/>
</clipPath>
</defs>
</svg></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Muse AMUS Payroll Integration Module</h1>
              <p className="mt-0 text-sm text-gray-600">Configure your payroll system integration in just a few steps.</p>
            </div>
            {/* <div className="hidden md:flex items-center space-x-2">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Live Demo
              </div>
            </div> */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                      isCompleted 
                        ? "bg-green-500 border-green-500 text-white" 
                        : isCurrent 
                        ? "bg-blue-500 border-blue-500 text-white" 
                        : "bg-white border-gray-300 text-gray-400"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${
                        isCompleted || isCurrent ? "text-gray-900" : "text-gray-500"
                      }`}>
                        {step.name}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          {/* API Credentials */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">API Configuration</h2>
                <p className="text-gray-600">Enter your API credentials to authenticate</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="client_id" className="block text-sm font-semibold text-gray-700">
                  Client ID *
                </label>
                <input
                  id="client_id"
                  name="client_id"
                  type="text"
                  placeholder="Enter your Client ID"
                  value={formData.client_id}
                  onChange={handleChange}
                  className={inputClass(!!errors.client_id)}
                  required
                />
                {errors.client_id && <p className="text-sm text-red-600 mt-1">{errors.client_id}</p>}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="client_secret" className="block text-sm font-semibold text-gray-700">
                  Client Secret *
                </label>
                <div className="relative">
                  <input
                    id="client_secret"
                    name="client_secret"
                    type={showClientSecret ? "text" : "password"}
                    placeholder="Enter your Client Secret"
                    value={formData.client_secret}
                    onChange={handleChange}
                    className={inputClass(!!errors.client_secret) + " pr-12"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowClientSecret(!showClientSecret)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showClientSecret ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.client_secret && <p className="text-sm text-red-600 mt-1">{errors.client_secret}</p>}
              </div>
            </div>
          </div>

          {/* Toggle for Existing Credentials */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Already have credentials?</h3>
                  <p className="text-sm text-gray-600">Use existing User ID and Session ID instead of creating new ones</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useExistingCredentials}
                  onChange={(e) => {
                    setUseExistingCredentials(e.target.checked);
                    setErrors({});
                  }}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {useExistingCredentials ? (
            /* Existing Credentials Section */
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Existing Credentials</h2>
                  <p className="text-gray-600">Enter your existing User ID and Session ID</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="existing_user_id" className="block text-sm font-semibold text-gray-700">
                    User ID *
                  </label>
                  <input
                    id="existing_user_id"
                    name="existing_user_id"
                    type="text"
                    placeholder="Enter your User ID"
                    value={formData.existing_user_id}
                    onChange={handleChange}
                    className={inputClass(!!errors.existing_user_id)}
                    required
                  />
                  {errors.existing_user_id && <p className="text-sm text-red-600 mt-1">{errors.existing_user_id}</p>}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="existing_session_id" className="block text-sm font-semibold text-gray-700">
                    Session ID *
                  </label>
                  <input
                    id="existing_session_id"
                    name="existing_session_id"
                    type="text"
                    placeholder="Enter your Session ID"
                    value={formData.existing_session_id}
                    onChange={handleChange}
                    className={inputClass(!!errors.existing_session_id)}
                    required
                  />
                  {errors.existing_session_id && <p className="text-sm text-red-600 mt-1">{errors.existing_session_id}</p>}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* User & Company Details */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* User Details */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">User Information</h2>
                      <p className="text-gray-600">Personal details for the account</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700">
                          First Name *
                        </label>
                        <input
                          id="first_name"
                          name="first_name"
                          type="text"
                          placeholder="John"
                          value={formData.first_name}
                          onChange={handleChange}
                          className={inputClass(!!errors.first_name)}
                          required
                        />
                        {errors.first_name && <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700">
                          Last Name *
                        </label>
                        <input
                          id="last_name"
                          name="last_name"
                          type="text"
                          placeholder="Doe"
                          value={formData.last_name}
                          onChange={handleChange}
                          className={inputClass(!!errors.last_name)}
                          required
                        />
                        {errors.last_name && <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john.doe@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={inputClass(!!errors.email)}
                        required
                      />
                      {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Company Details</h2>
                      <p className="text-gray-600">Organization information</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="company_name" className="block text-sm font-semibold text-gray-700">
                        Company Name *
                      </label>
                      <input
                        id="company_name"
                        name="company_name"
                        type="text"
                        placeholder="Acme Corporation"
                        value={formData.company_name}
                        onChange={handleChange}
                        className={inputClass(!!errors.company_name)}
                        required
                      />
                      {errors.company_name && <p className="text-sm text-red-600 mt-1">{errors.company_name}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payroll Details */}
          
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg flex items-center space-x-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing Integration...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-6 h-6" />
                  <span>Launch Payroll Demo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Iframe */}
        {showIframe && iframeUrl && (
          <div className="mt-12 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ask My Uncle Sam</h2>
                <p className="text-gray-600">Your payroll system is now integrated and ready to use</p>
              </div>
              {/* <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live</span>
              </div> */}
            </div>
            
            <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-inner">
              <iframe
                src={iframeUrl}
                title="Payroll Integration Demo"
               
                style={{width:'50%', height: "80vh", minHeight: "600px",float:'right' }}
                allow="clipboard-write; microphone; camera"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}