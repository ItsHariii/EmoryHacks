"""
Wellness Journal Chatbot Service using Gemini AI.

This service provides conversational AI assistance for daily wellness check-ins.
It engages users in natural conversation to capture mood, symptoms, and notes,
making journaling more intuitive and engaging for pregnant users.
"""

import os
import logging
import google.generativeai as genai
from typing import Dict, Any, List, Optional
from datetime import date

logger = logging.getLogger(__name__)


class WellnessChatbotService:
    """Service for handling wellness journal chatbot conversations."""
    
    # Symptom keyword mapping for data extraction
    SYMPTOM_KEYWORDS = {
        "nausea": ["nausea", "nauseous", "sick", "queasy", "morning sickness", "throw up", "vomit"],
        "fatigue": ["tired", "exhausted", "fatigue", "sleepy", "low energy", "drained", "worn out"],
        "headache": ["headache", "head hurts", "migraine", "head pain"],
        "back_pain": ["back pain", "backache", "sore back", "back hurts"],
        "swelling": ["swelling", "swollen", "puffy", "edema", "bloated"],
        "heartburn": ["heartburn", "acid reflux", "indigestion", "burning"],
        "mood_swings": ["mood swings", "emotional", "crying", "irritable", "moody"],
        "cravings": ["craving", "want to eat", "hungry for", "really want"],
        "insomnia": ["can't sleep", "insomnia", "trouble sleeping", "sleep problems"],
        "constipation": ["constipation", "constipated", "bloated", "digestive issues"],
        "dizziness": ["dizzy", "lightheaded", "faint", "vertigo"],
        "breast_tenderness": ["breast pain", "sore breasts", "tender breasts", "breast tenderness"],
        "frequent_urination": ["pee a lot", "frequent urination", "bathroom often", "urinate often"],
        "leg_cramps": ["leg cramps", "cramping", "muscle cramps", "charlie horse"],
        "shortness_of_breath": ["short of breath", "breathless", "hard to breathe", "breathing difficulty"]
    }
    
    # System prompt template for the wellness chatbot
    SYSTEM_PROMPT_TEMPLATE = """You are Ovi, a warm and empathetic wellness companion for pregnant individuals. 
Your role is to help users reflect on their day and track their wellness through natural conversation.

Guidelines:
- Be warm, supportive, and non-judgmental
- Ask open-ended questions to encourage sharing
- Acknowledge both positive and challenging experiences
- Never provide medical advice - suggest consulting healthcare providers when appropriate
- Keep responses concise (2-3 sentences)
- Use encouraging language and celebrate small wins
- Be sensitive to emotional and physical challenges of pregnancy
- Guide the conversation naturally to gather: mood, symptoms, and general notes
- When you have enough information, summarize what you've learned and ask if they'd like to save

Current conversation goal: Help the user document their daily wellness check-in including mood, symptoms, and general notes.

{user_context}

Remember: You're a supportive companion, not a medical professional. Focus on listening and documenting their experience."""
    
    def __init__(self):
        self.api_key = os.getenv('GEMINI_CHATBOT_API_KEY')
        self.model = None
        
        logger.info("Initializing WellnessChatbotService...")
        logger.info(f"GEMINI_API_KEY present: {bool(self.api_key)}")
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                # Use Gemini 2.5 Flash for fast, conversational responses
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                logger.info("✅ Wellness Chatbot Service initialized with Gemini 2.5 Flash")
            except Exception as e:
                logger.error(f"❌ Error initializing Gemini for wellness chatbot: {e}")
                self.model = None
        else:
            logger.warning("❌ GEMINI_API_KEY not found - wellness chatbot will be disabled")
    
    async def start_conversation(self, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Initialize a new wellness check-in conversation.
        
        Args:
            user_context: Optional user context (trimester, due_date, etc.)
        
        Returns:
            Dict with greeting message and initial state
        """
        if not self.model:
            return {
                "response": "I'm sorry, but the wellness chatbot is currently unavailable. Please try the traditional journal form.",
                "fallback_to_form": True,
                "error": "service_unavailable"
            }
        
        try:
            # Create personalized greeting
            greeting = self._create_greeting(user_context)
            
            return {
                "response": greeting,
                "conversation_started": True,
                "extracted_data": {},
                "suggestions": ["Tell me about your day", "I'm feeling...", "I've been experiencing..."]
            }
            
        except Exception as e:
            logger.error(f"Error starting conversation: {e}")
            return {
                "response": "Hi! How are you feeling today? 😊",
                "conversation_started": True,
                "extracted_data": {},
                "error": str(e)
            }
    
    async def continue_conversation(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process user message and generate response.
        
        Args:
            message: User's message
            conversation_history: List of previous messages [{"role": "user"|"assistant", "content": str}]
            user_context: Optional user context
        
        Returns:
            Dict with response, extracted data, and conversation state
        """
        if not self.model:
            return {
                "response": "I'm sorry, but the wellness chatbot is currently unavailable.",
                "fallback_to_form": True,
                "error": "service_unavailable"
            }
        
        try:
            # Extract data from current message
            extracted_data = await self._extract_data_from_message(message, conversation_history)
            
            # Generate contextual response
            response = await self._generate_response(
                message,
                conversation_history,
                extracted_data,
                user_context
            )
            
            # Determine if we have enough information
            is_complete = self._is_conversation_complete(extracted_data, conversation_history)
            
            result = {
                "response": response,
                "extracted_data": extracted_data,
                "is_complete": is_complete
            }
            
            # Add suggestions if conversation is not complete
            if not is_complete:
                result["suggestions"] = self._generate_suggestions(extracted_data)
            else:
                result["ready_to_save"] = True
                result["summary"] = self._create_summary(extracted_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in continue_conversation: {e}", exc_info=True)
            return {
                "response": "I'm having a bit of trouble right now. Could you tell me again how you're feeling?",
                "extracted_data": {},
                "error": str(e)
            }

    
    async def extract_journal_data(
        self,
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Extract structured journal entry data from conversation history.
        
        Args:
            conversation_history: Complete conversation history
        
        Returns:
            Dict with mood, symptoms, notes, and other journal fields
        """
        try:
            # Combine all user messages
            user_messages = [
                msg["content"] for msg in conversation_history 
                if msg.get("role") == "user"
            ]
            combined_text = " ".join(user_messages).lower()
            
            # Extract mood (1-5 scale)
            mood = self._extract_mood(combined_text)
            
            # Extract symptoms
            symptoms = self._extract_symptoms(combined_text)
            
            # Extract notes and cravings
            notes = self._extract_notes(conversation_history)
            cravings = self._extract_cravings(combined_text)
            
            # Extract sleep and energy if mentioned
            sleep_quality = self._extract_sleep_quality(combined_text)
            energy_level = self._extract_energy_level(combined_text)
            
            return {
                "mood": mood,
                "symptoms": symptoms,
                "notes": notes,
                "cravings": cravings,
                "sleep_quality": sleep_quality,
                "energy_level": energy_level
            }
            
        except Exception as e:
            logger.error(f"Error extracting journal data: {e}")
            return {
                "mood": None,
                "symptoms": [],
                "notes": " ".join([msg["content"] for msg in conversation_history if msg.get("role") == "user"]),
                "cravings": None,
                "sleep_quality": None,
                "energy_level": None
            }
    
    async def confirm_extracted_data(
        self,
        extracted_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate human-readable summary of extracted data for user confirmation.
        
        Creates a friendly summary that shows what information was captured
        from the conversation, allowing the user to review before saving.
        
        Args:
            extracted_data: Dictionary with mood, symptoms, notes, etc.
        
        Returns:
            Dict with confirmation message and formatted summary
        """
        try:
            summary_parts = []
            
            # Mood summary
            mood = extracted_data.get("mood")
            if mood:
                mood_labels = {
                    1: "very difficult 😔",
                    2: "challenging 😟",
                    3: "okay 😐",
                    4: "good 🙂",
                    5: "great 😊"
                }
                summary_parts.append(f"**Mood:** {mood_labels.get(mood, 'okay')}")
            
            # Symptoms summary
            symptoms = extracted_data.get("symptoms", [])
            if symptoms:
                symptom_display = ", ".join([s.replace("_", " ").title() for s in symptoms])
                summary_parts.append(f"**Symptoms:** {symptom_display}")
            
            # Cravings summary
            cravings = extracted_data.get("cravings")
            if cravings:
                summary_parts.append(f"**Cravings:** {cravings}")
            
            # Sleep quality summary
            sleep_quality = extracted_data.get("sleep_quality")
            if sleep_quality:
                sleep_labels = {1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent"}
                summary_parts.append(f"**Sleep Quality:** {sleep_labels.get(sleep_quality, 'Not recorded')}")
            
            # Energy level summary
            energy_level = extracted_data.get("energy_level")
            if energy_level:
                energy_labels = {1: "Very Low", 2: "Low", 3: "Moderate", 4: "Good", 5: "High"}
                summary_parts.append(f"**Energy Level:** {energy_labels.get(energy_level, 'Not recorded')}")
            
            # Notes summary (truncated if long)
            notes = extracted_data.get("notes", "")
            if notes and len(notes.strip()) > 0:
                notes_preview = notes[:100] + "..." if len(notes) > 100 else notes
                summary_parts.append(f"**Notes:** {notes_preview}")
            
            # Build confirmation message
            if summary_parts:
                summary_text = "\n".join(summary_parts)
                confirmation_message = f"Here's what I captured from our conversation:\n\n{summary_text}\n\nWould you like me to save this entry?"
            else:
                confirmation_message = "I didn't capture much information yet. Would you like to share more about your day before saving?"
            
            return {
                "confirmation_message": confirmation_message,
                "summary": summary_text if summary_parts else "",
                "has_sufficient_data": len(summary_parts) >= 1,
                "extracted_data": extracted_data
            }
            
        except Exception as e:
            logger.error(f"Error creating confirmation: {e}")
            return {
                "confirmation_message": "I've captured your wellness check-in. Would you like to save it?",
                "summary": "",
                "has_sufficient_data": True,
                "extracted_data": extracted_data
            }
    
    async def summarize_past_entry(self, journal_entry: Dict[str, Any]) -> str:
        """
        Convert journal entry to conversational summary.
        
        Args:
            journal_entry: Journal entry data from database
        
        Returns:
            Conversational summary string
        """
        if not self.model:
            return self._create_fallback_summary(journal_entry)
        
        try:
            prompt = f"""Convert this journal entry into a warm, conversational summary as if you're recalling the day with the user.

Journal Entry:
- Date: {journal_entry.get('entry_date')}
- Mood: {journal_entry.get('mood')}/5
- Symptoms: {', '.join(journal_entry.get('symptoms', [])) if journal_entry.get('symptoms') else 'None'}
- Notes: {journal_entry.get('notes', 'No notes')}
- Cravings: {journal_entry.get('cravings', 'None')}
- Sleep Quality: {journal_entry.get('sleep_quality', 'Not recorded')}/5
- Energy Level: {journal_entry.get('energy_level', 'Not recorded')}/5

Create a brief, empathetic summary (2-3 sentences) that captures the essence of their day.

Summary:"""
            
            response = self.model.generate_content(prompt)
            
            try:
                return response.text.strip()
            except:
                if response.candidates and len(response.candidates) > 0:
                    candidate = response.candidates[0]
                    if candidate.content and candidate.content.parts:
                        return ''.join([part.text for part in candidate.content.parts if hasattr(part, 'text')]).strip()
                return self._create_fallback_summary(journal_entry)
            
        except Exception as e:
            logger.error(f"Error summarizing past entry: {e}")
            return self._create_fallback_summary(journal_entry)
    
    # Private helper methods
    
    def _create_greeting(self, user_context: Optional[Dict[str, Any]] = None) -> str:
        """Create a personalized greeting message."""
        greetings = [
            "Hi! How are you feeling today? 😊",
            "Hello! I'd love to hear about your day. How are you doing? 💙",
            "Hey there! Let's check in - how has your day been? 🌟"
        ]
        
        # Simple random selection (use first one for consistency)
        return greetings[0]
    
    async def _extract_data_from_message(
        self,
        message: str,
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Extract structured data from the current message and history."""
        # Combine current message with history
        all_messages = conversation_history + [{"role": "user", "content": message}]
        return await self.extract_journal_data(all_messages)
    
    async def _generate_response(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        extracted_data: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate empathetic, contextual response using Gemini."""
        if not self.model:
            return "I hear you. Tell me more about how you're feeling."
        
        try:
            # Build context string
            context_str = self._build_user_context_string(user_context)
            
            # Create conversation context
            conversation_context = "\n".join([
                f"{msg['role'].capitalize()}: {msg['content']}"
                for msg in conversation_history[-5:]  # Last 5 messages for context
            ])
            
            # Build prompt
            prompt = f"""{self.SYSTEM_PROMPT_TEMPLATE.format(user_context=context_str)}

Previous conversation:
{conversation_context}

User's latest message: {message}

What we've gathered so far:
- Mood: {extracted_data.get('mood', 'Not yet shared')}
- Symptoms: {', '.join(extracted_data.get('symptoms', [])) if extracted_data.get('symptoms') else 'None mentioned'}
- Notes: {extracted_data.get('notes', 'None yet')}

Respond warmly and naturally. If you have enough information (mood and at least some context about their day), gently suggest summarizing and saving. Otherwise, ask a follow-up question to learn more.

Response:"""
            
            response = self.model.generate_content(prompt)
            
            try:
                return response.text.strip()
            except:
                if response.candidates and len(response.candidates) > 0:
                    candidate = response.candidates[0]
                    if candidate.content and candidate.content.parts:
                        return ''.join([part.text for part in candidate.content.parts if hasattr(part, 'text')]).strip()
                return "Thank you for sharing. How else are you feeling today?"
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I appreciate you sharing that with me. Is there anything else you'd like to tell me about your day?"
    
    def _extract_mood(self, text: str) -> Optional[int]:
        """
        Extract mood from text and map to 1-5 scale.
        
        Scale:
        5 - Very positive (great, wonderful, amazing, fantastic, excellent, happy, joyful)
        4 - Positive (good, fine, pretty good, decent, cheerful)
        3 - Neutral (okay, alright, so-so, meh, neutral)
        2 - Negative (bad, not good, rough, difficult, hard, struggling, sad, down, anxious)
        1 - Very negative (terrible, awful, horrible, miserable, very bad, depressed)
        
        Args:
            text: Combined text from conversation
        
        Returns:
            Mood score (1-5) or None if no mood indicators found
        """
        text_lower = text.lower()
        
        # Very positive mood indicators (5)
        very_positive = [
            "great", "wonderful", "amazing", "fantastic", "excellent", 
            "happy", "joyful", "ecstatic", "thrilled", "delighted",
            "blessed", "grateful", "love it", "feeling great", "best day"
        ]
        if any(word in text_lower for word in very_positive):
            return 5
        
        # Positive mood indicators (4)
        positive = [
            "good", "fine", "pretty good", "decent", "cheerful",
            "content", "satisfied", "pleasant", "nice", "well",
            "better", "improved", "positive", "upbeat"
        ]
        if any(word in text_lower for word in positive):
            return 4
        
        # Neutral mood (3)
        neutral = [
            "okay", "alright", "so-so", "meh", "neutral",
            "average", "normal", "same", "unchanged", "fair"
        ]
        if any(word in text_lower for word in neutral):
            return 3
        
        # Negative mood indicators (2)
        negative = [
            "bad", "not good", "rough", "difficult", "hard", 
            "struggling", "sad", "down", "anxious", "worried",
            "stressed", "overwhelmed", "frustrated", "upset",
            "uncomfortable", "challenging", "tough"
        ]
        if any(word in text_lower for word in negative):
            return 2
        
        # Very negative mood indicators (1)
        very_negative = [
            "terrible", "awful", "horrible", "miserable", "very bad",
            "depressed", "hopeless", "devastated", "worst", "unbearable",
            "can't cope", "breaking down", "really struggling"
        ]
        if any(word in text_lower for word in very_negative):
            return 1
        
        return None
    
    def _extract_symptoms(self, text: str) -> List[str]:
        """
        Extract symptoms from text using keyword matching.
        
        Handles multiple symptoms in a single message and maps them to
        database categories. Uses the SYMPTOM_KEYWORDS dictionary for matching.
        
        Args:
            text: Combined text from conversation
        
        Returns:
            List of symptom names (database categories)
        """
        found_symptoms = set()  # Use set to avoid duplicates
        text_lower = text.lower()
        
        # Iterate through all symptom categories and their keywords
        for symptom, keywords in self.SYMPTOM_KEYWORDS.items():
            # Check if any keyword matches in the text
            for keyword in keywords:
                if keyword in text_lower:
                    found_symptoms.add(symptom)
                    break  # Found this symptom, move to next category
        
        # Return as sorted list for consistency
        return sorted(list(found_symptoms))
    
    def _extract_notes(self, conversation_history: List[Dict[str, str]]) -> str:
        """
        Extract free-form notes from conversation.
        
        Combines all user messages into a coherent note, filtering out
        very short responses and focusing on meaningful content.
        
        Args:
            conversation_history: List of conversation messages
        
        Returns:
            Combined notes string
        """
        user_messages = [
            msg["content"] for msg in conversation_history 
            if msg.get("role") == "user" and len(msg.get("content", "").strip()) > 2
        ]
        
        if not user_messages:
            return ""
        
        # Join messages with proper spacing
        combined_notes = " ".join(user_messages)
        
        # Clean up the notes
        combined_notes = combined_notes.strip()
        
        # Limit length to reasonable size (500 chars)
        if len(combined_notes) > 500:
            combined_notes = combined_notes[:497] + "..."
        
        return combined_notes
    
    def _extract_cravings(self, text: str) -> Optional[str]:
        """
        Extract food cravings mentions from text.
        
        Looks for craving indicators and attempts to extract the specific
        food or type of food being craved.
        
        Args:
            text: Combined text from conversation
        
        Returns:
            Craving description or None if no cravings mentioned
        """
        text_lower = text.lower()
        
        # Craving indicators with their patterns
        craving_patterns = [
            ("craving ", "craving "),
            ("want to eat ", "want to eat "),
            ("hungry for ", "hungry for "),
            ("really want ", "really want "),
            ("dying for ", "dying for "),
            ("could really go for ", "could really go for "),
            ("would love ", "would love "),
            ("need some ", "need some ")
        ]
        
        for pattern, indicator in craving_patterns:
            if pattern in text_lower:
                # Find the position of the indicator
                start_idx = text_lower.find(pattern)
                
                # Extract text after the indicator (up to 100 chars or next sentence)
                after_indicator = text[start_idx + len(indicator):start_idx + len(indicator) + 100]
                
                # Try to extract until punctuation or common stop words
                stop_chars = ['.', '!', '?', ',', ' and ', ' but ', ' so ']
                end_idx = len(after_indicator)
                
                for stop_char in stop_chars:
                    pos = after_indicator.find(stop_char)
                    if pos > 0 and pos < end_idx:
                        end_idx = pos
                
                craving_text = after_indicator[:end_idx].strip()
                
                if craving_text and len(craving_text) > 2:
                    return craving_text
        
        return None
    
    def _extract_sleep_quality(self, text: str) -> Optional[int]:
        """Extract sleep quality from text (1-5 scale)."""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["slept great", "slept well", "good sleep", "great sleep"]):
            return 5
        if any(word in text_lower for word in ["slept okay", "decent sleep"]):
            return 3
        if any(word in text_lower for word in ["slept poorly", "bad sleep", "can't sleep", "didn't sleep"]):
            return 1
        
        return None
    
    def _extract_energy_level(self, text: str) -> Optional[int]:
        """Extract energy level from text (1-5 scale)."""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["lots of energy", "energetic", "full of energy"]):
            return 5
        if any(word in text_lower for word in ["tired", "exhausted", "drained", "no energy", "low energy"]):
            return 1
        if any(word in text_lower for word in ["okay energy", "moderate energy"]):
            return 3
        
        return None
    
    def _is_conversation_complete(
        self,
        extracted_data: Dict[str, Any],
        conversation_history: List[Dict[str, str]]
    ) -> bool:
        """Determine if we have enough information to save the entry."""
        # Need at least mood or some symptoms/notes
        has_mood = extracted_data.get("mood") is not None
        has_symptoms = len(extracted_data.get("symptoms", [])) > 0
        has_notes = len(extracted_data.get("notes", "").strip()) > 10
        
        # Need at least 2 exchanges (user has shared something meaningful)
        has_enough_conversation = len([m for m in conversation_history if m.get("role") == "user"]) >= 2
        
        return (has_mood or has_symptoms or has_notes) and has_enough_conversation
    
    def _generate_suggestions(self, extracted_data: Dict[str, Any]) -> List[str]:
        """Generate contextual suggestions for the user."""
        suggestions = []
        
        if not extracted_data.get("mood"):
            suggestions.append("How would you rate your mood today?")
        
        if not extracted_data.get("symptoms"):
            suggestions.append("Any physical symptoms you'd like to mention?")
        
        if not extracted_data.get("notes") or len(extracted_data.get("notes", "")) < 20:
            suggestions.append("Tell me more about your day")
        
        return suggestions[:2]  # Return max 2 suggestions
    
    def _create_summary(self, extracted_data: Dict[str, Any]) -> str:
        """
        Create a human-readable summary of extracted data.
        
        Used internally to generate brief summaries for conversation flow.
        
        Args:
            extracted_data: Dictionary with mood, symptoms, notes, etc.
        
        Returns:
            Brief summary string
        """
        parts = []
        
        mood = extracted_data.get("mood")
        if mood:
            mood_labels = {1: "difficult", 2: "challenging", 3: "okay", 4: "good", 5: "great"}
            parts.append(f"You felt {mood_labels.get(mood, 'okay')} today")
        
        symptoms = extracted_data.get("symptoms", [])
        if symptoms:
            symptom_str = ", ".join([s.replace("_", " ") for s in symptoms])
            parts.append(f"experienced {symptom_str}")
        
        cravings = extracted_data.get("cravings")
        if cravings:
            # Truncate long craving descriptions
            craving_text = cravings[:50] + "..." if len(cravings) > 50 else cravings
            parts.append(f"had cravings for {craving_text}")
        
        if not parts:
            return "You shared about your day"
        
        return " and ".join(parts) + "."
    
    def _build_user_context_string(self, user_context: Optional[Dict[str, Any]] = None) -> str:
        """Build user context string for prompts."""
        if not user_context:
            return "User context: Not available"
        
        context_parts = []
        
        if user_context.get("trimester"):
            context_parts.append(f"Trimester: {user_context['trimester']}")
        
        if user_context.get("due_date"):
            context_parts.append(f"Due date: {user_context['due_date']}")
        
        if user_context.get("recent_symptoms"):
            context_parts.append(f"Recent symptoms: {', '.join(user_context['recent_symptoms'])}")
        
        return "User context:\n" + "\n".join(f"- {part}" for part in context_parts) if context_parts else "User context: Not available"
    
    def _create_fallback_summary(self, journal_entry: Dict[str, Any]) -> str:
        """Create a simple summary without AI."""
        parts = []
        
        mood = journal_entry.get("mood")
        if mood:
            mood_labels = {1: "difficult", 2: "challenging", 3: "okay", 4: "good", 5: "great"}
            parts.append(f"You felt {mood_labels.get(mood, 'okay')}")
        
        symptoms = journal_entry.get("symptoms", [])
        if symptoms:
            symptom_str = ", ".join(symptoms).replace("_", " ")
            parts.append(f"experienced {symptom_str}")
        
        notes = journal_entry.get("notes")
        if notes and len(notes) > 0:
            parts.append(f"and shared: {notes[:100]}...")
        
        return " and ".join(parts) + "." if parts else "You logged your wellness check-in."


# Singleton instance
wellness_chatbot_service = WellnessChatbotService()
