import React, { useState } from 'react';
import { Modal, TouchableOpacity, View, Text, StyleSheet, Dimensions, ScrollView, SafeAreaView } from 'react-native';

export function TransactionInvoiceModal({ visible, onClose, txDetails }) {
    const [tab, setTab] = useState('transfers');
    const { width, height } = Dimensions.get('window');

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Text style={styles.title}>Transaction Details</Text>
                            <Text style={styles.subtitle}>CAVOS</Text>
                        </View>
                        <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                            <Text style={styles.closeIconText}>×</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tab Navigation */}
                    <View style={styles.tabContainer}>
                        <View style={styles.tabBar}>
                            <TouchableOpacity
                                style={[styles.tab, tab === 'transfers' && styles.activeTab]}
                                onPress={() => setTab('transfers')}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tabText, tab === 'transfers' && styles.activeTabText]}>
                                    Transfers
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, tab === 'timeline' && styles.activeTab]}
                                onPress={() => setTab('timeline')}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tabText, tab === 'timeline' && styles.activeTabText]}>
                                    Timeline
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.contentContainer}
                    >
                        {tab === 'transfers' ? (
                            <View style={styles.transfersTab}>
                                {txDetails.transfers.tokenTransfers.map((transfer, index) => (
                                    <View key={index} style={styles.transferItem}>
                                        <View style={styles.transferHeader}>
                                            <Text style={styles.tokenName}>{transfer.token}</Text>
                                            <Text style={[
                                                styles.amount,
                                                transfer.amount?.startsWith('-') ? styles.negativeAmount : styles.positiveAmount
                                            ]}>
                                                {transfer.amount}
                                            </Text>
                                        </View>

                                        <View style={styles.transferDetails}>
                                            <View style={styles.addressRow}>
                                                <Text style={styles.label}>From</Text>
                                                <Text style={styles.address} numberOfLines={1}>
                                                    {transfer.from.slice(0, 6)}...{transfer.from.slice(-6)}
                                                </Text>
                                            </View>

                                            <View style={styles.addressRow}>
                                                <Text style={styles.label}>To</Text>
                                                <Text style={styles.address} numberOfLines={1}>
                                                    {transfer.to.slice(0, 6)}...{transfer.to.slice(-6)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.timelineTab}>
                                {[...txDetails.transfers.events].reverse().map((event, index) => (
                                    <View key={index} style={styles.eventItem}>
                                        <View style={styles.eventHeader}>
                                            <Text style={styles.eventName}>{event.name}</Text>
                                            <Text style={styles.eventTime}>
                                                {new Date(event.timestamp * 1000).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: false
                                                })}
                                            </Text>
                                        </View>
                                        <View style={styles.eventDetails}>
                                            <View style={styles.addressRow}>
                                                <Text style={styles.label}>Address</Text>
                                                <Text style={styles.address} numberOfLines={1}>
                                                    {event.from.slice(0, 6)}...{event.from.slice(-6)}
                                                </Text>
                                            </View>
                                            {event.contractAlias && (
                                                <View style={styles.addressRow}>
                                                    <Text style={styles.label}>Contract</Text>
                                                    <Text style={styles.contractName} numberOfLines={1}>
                                                        {event.contractAlias}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B6B6B',
        fontWeight: '500',
    },
    closeIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIconText: {
        fontSize: 20,
        color: '#6B6B6B',
        fontWeight: '300',
    },
    tabContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B6B6B',
    },
    activeTabText: {
        color: '#1A1A1A',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    contentContainer: {
        paddingTop: 20,
        paddingBottom: 10,
    },
    transfersTab: {
        gap: 16,
    },
    transferItem: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    transferHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tokenName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
    },
    positiveAmount: {
        color: '#10B981',
    },
    negativeAmount: {
        color: '#EF4444',
    },
    transferDetails: {
        gap: 8,
    },
    addressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B6B6B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    address: {
        fontSize: 14,
        fontFamily: 'monospace',
        color: '#374151',
        fontWeight: '500',
    },
    timelineTab: {
        gap: 16,
    },
    eventItem: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    eventName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    eventTime: {
        fontSize: 14,
        color: '#6B6B6B',
        fontFamily: 'monospace',
    },
    eventDetails: {
        gap: 8,
    },
    contractName: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    closeButton: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
