import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BiDonateHeart, BiShieldAlt, BiGlobe, BiHappy } from 'react-icons/bi';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <BiDonateHeart className="text-4xl text-primary-600" />,
      title: 'Easy Donations',
      description: 'Donate surplus food to those in need with just a few clicks'
    },
    {
      icon: <BiShieldAlt className="text-4xl text-primary-600" />,
      title: 'Blockchain Secured',
      description: 'All transactions are recorded on the blockchain for transparency'
    },
    {
      icon: <BiGlobe className="text-4xl text-primary-600" />,
      title: 'Reduce Food Waste',
      description: 'Help reduce food waste and feed communities'
    },
    {
      icon: <BiHappy className="text-4xl text-primary-600" />,
      title: 'Happy Recipients',
      description: 'Make a difference in someone\'s life today'
    }
  ];

  const steps = [
    { step: 1, title: 'Connect Wallet', description: 'Connect your crypto wallet to get started' },
    { step: 2, title: 'Register Account', description: 'Choose your role (Donor, Store, Recipient, or Courier)' },
    { step: 3, title: 'Browse Products', description: 'Find available food products to donate' },
    { step: 4, title: 'Make Donation', description: 'Create a donation and track its journey' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl p-12 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            FoodChain
          </h1>
          <p className="text-xl mb-6 opacity-95">
            Blockchain-Powered Food Donation Platform
          </p>
          <p className="text-lg mb-8 opacity-90">
            Connect donors with stores, couriers, and recipients in a transparent, 
            secure, and efficient ecosystem powered by blockchain technology.
          </p>
          {!isAuthenticated ? (
            <Link to="/login" className="inline-flex items-center space-x-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              <span>Get Started</span>
              <FiArrowRight />
            </Link>
          ) : (
            <Link to="/dashboard" className="inline-flex items-center space-x-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              <span>Go to Dashboard</span>
              <FiArrowRight />
            </Link>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">1000+</div>
          <div className="text-gray-600 mt-1">Donations Made</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">500+</div>
          <div className="text-gray-600 mt-1">Happy Recipients</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">50+</div>
          <div className="text-gray-600 mt-1">Store Partners</div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Why Choose FoodChain?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="card text-center hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.step} className="card text-center relative">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                {step.step}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-100 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Ready to Make a Difference?</h2>
        <p className="text-gray-600 mb-6">
          Join FoodChain today and be part of the solution to reduce food waste.
        </p>
        {!isAuthenticated ? (
          <Link to="/login" className="btn-primary inline-flex items-center space-x-2">
            <span>Connect Wallet</span>
            <FiArrowRight />
          </Link>
        ) : (
          <Link to="/donations" className="btn-primary inline-flex items-center space-x-2">
            <span>Start Donating</span>
            <FiArrowRight />
          </Link>
        )}
      </div>
    </div>
  );
};

export default Home;