import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency: string = "MXN", rate: number = 1): string {
  const converted = amount / rate;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}

// Simple translation dictionary
const translations = {
  en: {
    "dashboard": "Dashboard",
    "tabs": "Tabs",
    "menu": "Menu",
    "inventory": "Inventory",
    "reports": "Reports",
    "settings": "Settings",
    "open_tabs": "Open Tabs",
    "active_shift": "Active Shift",
    "no_active_shift": "No Active Shift",
    "start_shift": "Start Shift",
    "close_shift": "Close Shift",
    "low_stock": "Low Stock Alerts",
    "all_good": "Inventory looks good",
    "new_tab": "New Tab",
    "close_tab": "Close Tab",
    "add_drink": "Add Drink",
    "total": "Total",
    "cash": "Cash",
    "card": "Card",
    "ingredients": "Ingredients",
    "drinks": "Drinks",
    "sales": "Sales",
    "switch_user": "Switch User",
    "login": "Log In",
    "logout": "Log Out",
    "pin_prompt": "Enter your PIN",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "name": "Name",
    "category": "Category",
    "cost": "Cost",
    "price": "Price",
    "stock": "Stock",
    "save": "Save",
    "edit": "Edit",
    "delete": "Delete"
  },
  es: {
    "dashboard": "Panel",
    "tabs": "Cuentas",
    "menu": "Menú",
    "inventory": "Inventario",
    "reports": "Reportes",
    "settings": "Ajustes",
    "open_tabs": "Cuentas Abiertas",
    "active_shift": "Turno Activo",
    "no_active_shift": "Ningún Turno Activo",
    "start_shift": "Iniciar Turno",
    "close_shift": "Cerrar Turno",
    "low_stock": "Alertas de Stock",
    "all_good": "Inventario en orden",
    "new_tab": "Nueva Cuenta",
    "close_tab": "Cerrar Cuenta",
    "add_drink": "Agregar Bebida",
    "total": "Total",
    "cash": "Efectivo",
    "card": "Tarjeta",
    "ingredients": "Ingredientes",
    "drinks": "Bebidas",
    "sales": "Ventas",
    "switch_user": "Cambiar Usuario",
    "login": "Iniciar Sesión",
    "logout": "Cerrar Sesión",
    "pin_prompt": "Ingrese su PIN",
    "cancel": "Cancelar",
    "confirm": "Confirmar",
    "name": "Nombre",
    "category": "Categoría",
    "cost": "Costo",
    "price": "Precio",
    "stock": "Inventario",
    "save": "Guardar",
    "edit": "Editar",
    "delete": "Eliminar"
  }
} as const;

export type TranslationKey = keyof typeof translations.en;

export function getTranslation(key: string, lang: 'en' | 'es'): string {
  const k = key as TranslationKey;
  if (translations[lang] && translations[lang][k]) {
    return translations[lang][k];
  }
  return key; // Fallback to key itself
}
