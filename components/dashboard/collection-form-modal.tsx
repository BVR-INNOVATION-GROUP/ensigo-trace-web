"use client";

import { Modal } from "@/components/ui/modal";
import { CollectionForm } from "./collection-form";
import type { SeedCollectionI } from "@/src/models/SeedCollection";

interface CollectionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    collection?: SeedCollectionI;
    onSubmit: (data: Omit<SeedCollectionI, "id">) => Promise<void>;
    loading?: boolean;
}

export function CollectionFormModal({
    isOpen,
    onClose,
    collection,
    onSubmit,
    loading = false,
}: CollectionFormModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={collection ? "Edit Collection" : "New Seed Collection"}
            size="xl"
        >
            <div className="p-6">
                <CollectionForm
                    collection={collection}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                    loading={loading}
                />
            </div>
        </Modal>
    );
}

