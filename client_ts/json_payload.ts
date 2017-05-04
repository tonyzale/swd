interface ModalOption {
  text: string;
  option_idx: number;
  card_id: number;
}

interface Modal {
  id: string;
  title: string;
  text: string;
  options?: ModalOption[];
}
