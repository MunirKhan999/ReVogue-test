import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Sparkles, Upload, X, Plus, ShoppingBag } from 'lucide-react';
const { useState, useRef, useEffect } = React;
const { Send, Trash2, Sparkles, Upload, X, Plus, ShoppingBag } = window.lucide;

// Then paste the entire ReVogue component code
function ReVogueApp() {
    // ... all the component code
}

// Export it
window.ReVogueApp = ReVogueApp;

export default function ReVogueApp() {
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to ReVogue! Upload your wardrobe items and I\'ll help you create complete outfits. Let\'s get started!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchImages, setBatchImages] = useState([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [itemDescription, setItemDescription] = useState({
    type: '',
    color: '',
    style: '',
    condition: 'preloved'
  });
  const [conversationState, setConversationState] = useState({
    isAskingQuestions: false,
    currentQuestion: 0,
    answers: {}
  });
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const questions = [
    { 
      key: 'event', 
      text: 'Where are you going?',
      placeholder: 'e.g., wedding, office, party, date, casual hangout'
    },
    { 
      key: 'weather', 
      text: 'What\'s the weather like?',
      placeholder: 'e.g., hot, cold, rainy, mild'
    },
    { 
      key: 'time', 
      text: 'What time of day?',
      placeholder: 'morning, afternoon, evening, night'
    },
    { 
      key: 'location', 
      text: 'Indoor or outdoor?',
      placeholder: 'indoor, outdoor, or both'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleBatchUpload = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            id: Date.now() + Math.random(),
            url: event.target.result,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(images => {
      setBatchImages(images);
      setCurrentBatchIndex(0);
      setShowBatchModal(true);
    });
  };

  const handleSaveBatchItem = () => {
    if (!itemDescription.type || !itemDescription.color) {
      alert('Please fill in type and color!');
      return;
    }

    const newItem = {
      id: Date.now(),
      image: batchImages[currentBatchIndex],
      ...itemDescription
    };

    setWardrobeItems(prev => [...prev, newItem]);

    // Reset form
    setItemDescription({
      type: '',
      color: '',
      style: '',
      condition: 'preloved'
    });

    // Move to next image or close
    if (currentBatchIndex < batchImages.length - 1) {
      setCurrentBatchIndex(currentBatchIndex + 1);
    } else {
      setShowBatchModal(false);
      setBatchImages([]);
      setCurrentBatchIndex(0);
      
      // Show completion message and start questions if enough items
      const totalItems = wardrobeItems.length + 1;
      if (totalItems >= 3) {
        setMessages(prev => [...prev, 
          { role: 'assistant', content: `Great! You've added ${totalItems} items to your wardrobe. Ready to get styled? I'll ask you a few questions to create the perfect outfit.` }
        ]);
        
        setTimeout(() => {
          const firstQuestion = startQuestionFlow();
          setMessages(prev => [...prev, 
            { role: 'assistant', content: firstQuestion }
          ]);
        }, 500);
      } else {
        setMessages(prev => [...prev, 
          { role: 'assistant', content: `Added ${totalItems} item${totalItems > 1 ? 's' : ''}! Add at least 3 items (top, bottom, and shoes) to get outfit suggestions.` }
        ]);
      }
    }
  };

  const handleSkipBatchItem = () => {
    if (currentBatchIndex < batchImages.length - 1) {
      setCurrentBatchIndex(currentBatchIndex + 1);
    } else {
      setShowBatchModal(false);
      setBatchImages([]);
      setCurrentBatchIndex(0);
      
      if (wardrobeItems.length >= 3) {
        setTimeout(() => {
          const firstQuestion = startQuestionFlow();
          setMessages(prev => [...prev, 
            { role: 'assistant', content: firstQuestion }
          ]);
        }, 500);
      }
    }
    
    setItemDescription({
      type: '',
      color: '',
      style: '',
      condition: 'preloved'
    });
  };

  const removeItem = (id) => {
    setWardrobeItems(prev => prev.filter(item => item.id !== id));
  };

  const startQuestionFlow = () => {
    setConversationState({
      isAskingQuestions: true,
      currentQuestion: 0,
      answers: {}
    });
    
    return questions[0].text + '\n\nExample: ' + questions[0].placeholder;
  };

  const handleQuestionAnswer = (answer) => {
    const currentQ = questions[conversationState.currentQuestion];
    const newAnswers = {
      ...conversationState.answers,
      [currentQ.key]: answer.toLowerCase()
    };

    if (conversationState.currentQuestion < questions.length - 1) {
      const nextQuestion = conversationState.currentQuestion + 1;
      setConversationState({
        isAskingQuestions: true,
        currentQuestion: nextQuestion,
        answers: newAnswers
      });
      
      return questions[nextQuestion].text + '\n\nExample: ' + questions[nextQuestion].placeholder;
    } else {
      setConversationState({
        isAskingQuestions: false,
        currentQuestion: 0,
        answers: {}
      });
      
      return generateOutfitSuggestions(newAnswers);
    }
  };

  const generateOutfitSuggestions = (context) => {
    if (wardrobeItems.length < 3) {
      return "Please add at least 3 items to your wardrobe (top, bottom, and shoes) to get outfit suggestions.";
    }

    const { event = '', weather = '', time = '', location = '' } = context;

    // Categorize wardrobe items
    const tops = wardrobeItems.filter(item => 
      ['shirt', 'top', 'tee', 'blouse', 't-shirt', 'tshirt', 'sweater', 'hoodie'].some(t => 
        item.type.toLowerCase().includes(t)
      )
    );
    
    const bottoms = wardrobeItems.filter(item => 
      ['pant', 'jean', 'skirt', 'short', 'trouser'].some(t => 
        item.type.toLowerCase().includes(t)
      )
    );

    const dresses = wardrobeItems.filter(item => 
      item.type.toLowerCase().includes('dress')
    );

    const shoes = wardrobeItems.filter(item => 
      ['shoe', 'sneaker', 'boot', 'sandal', 'heel'].some(t => 
        item.type.toLowerCase().includes(t)
      )
    );

    const jackets = wardrobeItems.filter(item => 
      ['jacket', 'coat', 'blazer', 'cardigan'].some(t => 
        item.type.toLowerCase().includes(t)
      )
    );

    let response = `**Your Complete Outfit for ${event}**\n\n`;
    response += `Context: ${time} • ${location} • ${weather} weather\n\n`;

    // Generate 2-3 outfit combinations
    const outfits = [];
    
    for (let i = 0; i < 2; i++) {
      let outfit = { items: [], description: '' };
      
      // Choose base outfit (dress or top+bottom)
      if (dresses.length > 0 && Math.random() > 0.5) {
        const dress = dresses[Math.floor(Math.random() * dresses.length)];
        outfit.items.push(dress);
        outfit.description = `**Outfit ${i + 1}: The Dress Look**\n`;
        outfit.description += `• ${dress.color} ${dress.type}${dress.style ? ` (${dress.style})` : ''}\n`;
      } else if (tops.length > 0 && bottoms.length > 0) {
        const top = tops[Math.floor(Math.random() * tops.length)];
        const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
        outfit.items.push(top, bottom);
        outfit.description = `**Outfit ${i + 1}: Classic Combo**\n`;
        outfit.description += `• ${top.color} ${top.type}${top.style ? ` (${top.style})` : ''}\n`;
        outfit.description += `• ${bottom.color} ${bottom.type}${bottom.style ? ` (${bottom.style})` : ''}\n`;
      }

      // Add shoes (required)
      if (shoes.length > 0) {
        const shoe = shoes[Math.floor(Math.random() * shoes.length)];
        outfit.items.push(shoe);
        outfit.description += `• ${shoe.color} ${shoe.type}\n`;
      }

      // Add jacket if weather is cold or item exists
      if (jackets.length > 0 && (weather.includes('cold') || weather.includes('rain') || Math.random() > 0.6)) {
        const jacket = jackets[Math.floor(Math.random() * jackets.length)];
        outfit.items.push(jacket);
        outfit.description += `• ${jacket.color} ${jacket.type} (layer)\n`;
      }

      // Add styling tip
      if (event.includes('date') || event.includes('romantic')) {
        outfit.description += '\nStyling tip: Keep accessories minimal and elegant. Confidence is your best accessory.\n';
      } else if (event.includes('party') || event.includes('club')) {
        outfit.description += '\nStyling tip: Bold choices work here. Add statement accessories if you have them.\n';
      } else if (event.includes('work') || event.includes('office') || event.includes('professional')) {
        outfit.description += '\nStyling tip: Keep it polished and professional. Neutral colors project confidence.\n';
      } else if (event.includes('casual')) {
        outfit.description += '\nStyling tip: Comfort meets style. Mix textures for visual interest.\n';
      }

      if (outfit.items.length >= 3) {
        outfits.push(outfit);
      }
    }

    // Build response
    if (outfits.length === 0) {
      return "I need more variety in your wardrobe. Please add:\n- At least one top or shirt\n- At least one bottom (pants/skirt)\n- At least one pair of shoes";
    }

    outfits.forEach(outfit => {
      response += outfit.description + '\n';
    });

    response += `\n**Why these work:**\n`;
    if (weather.includes('cold')) {
      response += '• Layering for warmth without sacrificing style\n';
    }
    if (location.includes('outdoor')) {
      response += '• Practical pieces suitable for outdoor activities\n';
    }
    if (time.includes('evening') || time.includes('night')) {
      response += '• Colors and styles appropriate for evening events\n';
    }

    response += '\nWant different combinations? Just ask!';

    return response;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    setTimeout(() => {
      let aiResponse;
      
      if (conversationState.isAskingQuestions) {
        aiResponse = handleQuestionAnswer(userMessage);
      } else {
        if (userMessage.toLowerCase().includes('style') || 
            userMessage.toLowerCase().includes('outfit') ||
            userMessage.toLowerCase().includes('suggest')) {
          if (wardrobeItems.length >= 3) {
            aiResponse = startQuestionFlow();
          } else {
            aiResponse = "Please add at least 3 items to your wardrobe first. You need a top, bottom, and shoes at minimum.";
          }
        } else {
          aiResponse = "I'm ready to help you create outfits! Type 'suggest outfit' when you have at least 3 items in your wardrobe.";
        }
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-purple-500">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-3 rounded-xl shadow-lg">
                <ShoppingBag className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-purple-900">
                  ReVogue
                </h1>
                <p className="text-sm text-purple-600">Your AI Fashion Stylist</p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <Upload className="w-5 h-5" />
              Upload Items
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wardrobe Gallery */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-5 sticky top-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-purple-900">Wardrobe</h2>
                <span className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                  {wardrobeItems.length}
                </span>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleBatchUpload}
                accept="image/*"
                multiple
                className="hidden"
              />

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {wardrobeItems.length === 0 ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-3 border-dashed border-purple-300 rounded-xl p-10 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <Sparkles className="w-14 h-14 text-purple-400 mx-auto mb-3" />
                    <p className="text-purple-700 font-semibold text-lg">Upload Your Clothes</p>
                    <p className="text-sm text-purple-500 mt-2">Add multiple items at once</p>
                  </div>
                ) : (
                  wardrobeItems.map(item => (
                    <div key={item.id} className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all border border-purple-200">
                      <div className="flex gap-3">
                        {item.image && (
                          <img 
                            src={item.image.url} 
                            alt={item.type}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-purple-300"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-purple-900 truncate text-sm">
                            {item.color} {item.type}
                          </h3>
                          {item.style && (
                            <p className="text-xs text-purple-600">{item.style}</p>
                          )}
                          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.condition === 'new' 
                              ? 'bg-green-100 text-green-700 border border-green-300' 
                              : 'bg-blue-100 text-blue-700 border border-blue-300'
                          }`}>
                            {item.condition === 'new' ? 'New' : 'Preloved'}
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 h-[700px] flex flex-col">
              <div className="border-b-2 border-purple-200 p-5 bg-gradient-to-r from-purple-50 to-white">
                <h3 className="font-bold text-purple-900 text-lg">AI Stylist</h3>
                <p className="text-sm text-purple-600">Get personalized outfit recommendations</p>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-purple-50">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-800 border-2 border-purple-200'
                      }`}
                    >
                      <p className="whitespace-pre-line text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-purple-200 rounded-2xl px-5 py-3 shadow-md">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t-2 border-purple-200 p-4 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your answer or ask for outfit suggestions..."
                    className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Upload Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-4 border-purple-500">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-purple-900">
                  Item {currentBatchIndex + 1} of {batchImages.length}
                </h2>
                <button
                  onClick={() => {
                    setShowBatchModal(false);
                    setBatchImages([]);
                    setCurrentBatchIndex(0);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {batchImages[currentBatchIndex] && (
                <img 
                  src={batchImages[currentBatchIndex].url} 
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-xl mb-5 border-4 border-purple-200"
                />
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-purple-900 mb-2">
                    Type *
                  </label>
                  <input
                    type="text"
                    value={itemDescription.type}
                    onChange={(e) => setItemDescription({...itemDescription, type: e.target.value})}
                    placeholder="shirt, pants, dress, jacket, shoes..."
                    className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-purple-900 mb-2">
                    Color *
                  </label>
                  <input
                    type="text"
                    value={itemDescription.color}
                    onChange={(e) => setItemDescription({...itemDescription, color: e.target.value})}
                    placeholder="black, white, blue..."
                    className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-purple-900 mb-2">
                    Style (optional)
                  </label>
                  <input
                    type="text"
                    value={itemDescription.style}
                    onChange={(e) => setItemDescription({...itemDescription, style: e.target.value})}
                    placeholder="formal, casual, party, sporty..."
                    className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-purple-900 mb-2">
                    Condition
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        value="preloved"
                        checked={itemDescription.condition === 'preloved'}
                        onChange={(e) => setItemDescription({...itemDescription, condition: e.target.value})}
                        className="text-purple-600"
                      />
                      <span className="text-sm font-medium text-purple-900">Preloved</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        value="new"
                        checked={itemDescription.condition === 'new'}
                        onChange={(e) => setItemDescription({...itemDescription, condition: e.target.value})}
                        className="text-purple-600"
                      />
                      <span className="text-sm font-medium text-purple-900">New</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSkipBatchItem}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSaveBatchItem}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    {currentBatchIndex < batchImages.length - 1 ? 'Next' : 'Finish'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}