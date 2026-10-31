# Material Symbols icons

Google Material Symbols, Outlined style, 24px optical size.
Source: https://fonts.google.com/icons — licensed Apache License 2.0.

Every file was sanitized on download: only `<svg>` and `<path>` elements are kept,
and `fill` is `currentColor`, so icons take the color of the text around them.

## Use

```jsx
import Icon from "../components/Icon.jsx";

<Icon name="shopping_cart" />            // decorative, 20px
<Icon name="delete" title="Delete" />    // meaningful, read by screen readers
```

Look-up is by file name only — the group folder is just for organizing.

## Folder structure

```text
material/
├── navigation/   ← moving around: menus, back/forward, chevrons, login/logout
│   ├── arrow_back.svg
│   ├── arrow_forward.svg
│   ├── chevron_left.svg
│   ├── chevron_right.svg
│   ├── close.svg
│   ├── expand_less.svg
│   ├── expand_more.svg
│   ├── home.svg
│   ├── login.svg
│   ├── logout.svg
│   ├── menu.svg
│   ├── open_in_new.svg
├── commerce/   ← buying and selling: cart, store, payments, shipping, inventory
│   ├── account_balance_wallet.svg
│   ├── add_shopping_cart.svg
│   ├── category.svg
│   ├── grocery.svg   (category tile)
│   ├── checkroom.svg   (category tile)
│   ├── chair.svg   (category tile)
│   ├── spa.svg   (category tile)
│   ├── devices.svg   (category tile)
│   ├── directions_car.svg   (category tile)
│   ├── inventory_2.svg
│   ├── local_mall.svg
│   ├── local_shipping.svg
│   ├── payments.svg
│   ├── receipt_long.svg
│   ├── sell.svg
│   ├── shopping_bag.svg
│   ├── shopping_cart.svg
│   ├── store.svg
│   ├── storefront.svg
├── account/   ← people and identity: user, group, verified, admin, contact
│   ├── admin_panel_settings.svg
│   ├── badge.svg
│   ├── call.svg
│   ├── group.svg
│   ├── how_to_reg.svg
│   ├── location_on.svg
│   ├── lock.svg
│   ├── mail.svg
│   ├── person.svg
│   ├── person_add.svg
│   ├── verified.svg
│   ├── verified_user.svg
├── actions/   ← things you do: search, filter, add, edit, delete, refresh
│   ├── add.svg
│   ├── block.svg
│   ├── delete.svg
│   ├── download.svg
│   ├── edit.svg
│   ├── filter_list.svg
│   ├── refresh.svg
│   ├── remove.svg
│   ├── restart_alt.svg
│   ├── search.svg
│   ├── sort.svg
│   ├── upload_file.svg
│   ├── visibility.svg
├── status/   ← state feedback: success, error, warning, pending, info
│   ├── cancel.svg
│   ├── check_circle.svg
│   ├── error.svg
│   ├── help.svg
│   ├── info.svg
│   ├── notifications.svg
│   ├── pending.svg
│   ├── schedule.svg
│   ├── warning.svg
├── documents/   ← verification paperwork: ID, certificate, OCR scan
│   ├── description.svg
│   ├── document_scanner.svg
│   ├── fact_check.svg
│   ├── id_card.svg
├── analytics/   ← numbers: dashboard, charts, trends
│   ├── bar_chart.svg
│   ├── dashboard.svg
│   ├── monitoring.svg
│   ├── trending_down.svg
│   ├── trending_up.svg
├── admin/   ← platform controls: toggles, moderation, settings
│   ├── flag.svg
│   ├── gavel.svg
│   ├── settings.svg
│   ├── toggle_off.svg
│   ├── toggle_on.svg
├── media/   ← pictures: image placeholder
│   ├── image.svg
```

## Add an icon

1. Find it at https://fonts.google.com/icons (Outlined style).
2. Download the 24px SVG from
   `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/<name>/default/24px.svg`
3. Put it in the matching group folder, keep the file name as the icon name.
4. Make sure it only has `<svg>` and `<path>`, and set `fill="currentColor"` on the `<svg>`.
5. File names must be unique across all folders.
